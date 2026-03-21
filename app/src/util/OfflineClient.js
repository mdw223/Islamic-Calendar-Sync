/**
 * OfflineClient.js
 *
 * IndexedDB-backed client that mirrors the APIClient static interface.
 * Used by CalendarContext when the user is an unauthenticated offline guest.
 *
 * All data lives in Dexie (see OfflineDb.js).  On login the data is synced
 * to the backend via APIClient.syncOfflineEvents / syncOfflinePreferences,
 * then cleared with OfflineClient.clearAll().
 */

import db from "./OfflineDb";
import {
  getMergedDefinitions,
  generateForOfflineUser,
} from "../services/IslamicEventService";

/**
 * Map a raw Dexie record (auto-increment `id`) to the shape the frontend
 * expects (`eventId`), so all code can use `eventId` uniformly.
 */
function mapDexieEvent(record) {
  if (!record) return null;
  const { id, ...rest } = record;
  return { ...rest, eventId: id };
}

export default class OfflineClient {
  // ── Events ─────────────────────────────────────────────────────────────

  static async getEvents() {
    const raw = await db.events.toArray();
    return { success: true, events: raw.map(mapDexieEvent) };
  }

  static async getEventById(eventId) {
    const event = await db.events.get(eventId);
    return { success: true, event: mapDexieEvent(event) };
  }

  static async createEvent(eventData) {
    const { eventId: _strip, ...rest } = eventData;
    const now = new Date().toISOString();
    const record = {
      ...rest,
      location: rest.location ?? null,
      eventTimezone: rest.eventTimezone ?? null,
      isTask: rest.isTask ?? false,
      hide: rest.hide ?? false,
      islamicDefinitionId: rest.islamicDefinitionId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.events.add(record);
    return { success: true, event: { ...record, eventId: id } };
  }

  static async updateEvent(eventId, updates) {
    const now = new Date().toISOString();
    await db.events.update(eventId, { ...updates, updatedAt: now });
    const event = await db.events.get(eventId);
    return { success: true, event: mapDexieEvent(event) };
  }

  static async deleteEvent(eventId) {
    await db.events.delete(eventId);
    return { success: true };
  }

  // ── Islamic event generation ───────────────────────────────────────────

  static async generateEvents(years, timezone = null) {
    const result = await generateForOfflineUser(years, timezone);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const existing = await db.generationMeta.get("generatedYearsRange");
    const nextStart =
      existing?.generatedYearsStart == null
        ? minYear
        : Math.min(existing.generatedYearsStart, minYear);
    const nextEnd =
      existing?.generatedYearsEnd == null
        ? maxYear
        : Math.max(existing.generatedYearsEnd, maxYear);
    await db.generationMeta.put({
      key: "generatedYearsRange",
      generatedYearsStart: nextStart,
      generatedYearsEnd: nextEnd,
    });
    return result;
  }

  static async getGeneratedYearsRange() {
    const row = await db.generationMeta.get("generatedYearsRange");
    return {
      generatedYearsStart: row?.generatedYearsStart ?? null,
      generatedYearsEnd: row?.generatedYearsEnd ?? null,
    };
  }

  // ── Definitions ────────────────────────────────────────────────────────

  static async getDefinitions() {
    const definitions = await getMergedDefinitions();
    return { success: true, definitions };
  }

  static async updateDefinitionPreference(definitionId, isHidden) {
    // Upsert preference.
    await db.definitionPreferences.put({ definitionId, isHidden });

    // Update hide flag on all matching events in IndexedDB.
    const matching = await db.events
      .where("islamicDefinitionId")
      .equals(definitionId)
      .toArray();

    if (matching.length > 0) {
      await db.events.bulkPut(
        matching.map((e) => ({ ...e, hide: isHidden })),
      );
    }

    return {
      success: true,
      definitionId,
      isHidden,
      eventsUpdated: matching.length,
    };
  }

  // ── Sync helpers ───────────────────────────────────────────────────────

  /**
   * Collect all local data for sending to the backend on login.
   * Returns null if there is nothing to sync.
   */
  static async getAllDataForSync() {
    const [events, preferences, generationMeta, userLocations] = await Promise.all([
      db.events.toArray(),
      db.definitionPreferences.toArray(),
      db.generationMeta.get("generatedYearsRange"),
      db.userLocations?.toArray?.() ?? [],
    ]);

    if (
      events.length === 0 &&
      preferences.length === 0 &&
      generationMeta == null &&
      userLocations.length === 0
    ) {
      return null;
    }

    return {
      // Strip local auto-increment `id` and any `eventId` — backend assigns real EventId.
      events: events.map(({ id, eventId, createdAt, updatedAt, ...rest }) => rest),
      preferences,
      userLocations: userLocations.map(({ id, ...rest }) => rest),
      generatedYearsStart: generationMeta?.generatedYearsStart ?? null,
      generatedYearsEnd: generationMeta?.generatedYearsEnd ?? null,
    };
  }

  /**
   * Wipe all offline data after a successful sync.
   */
  static async clearAll() {
    await Promise.all([
      db.events.clear(),
      db.definitionPreferences.clear(),
      db.generationMeta.clear(),
      db.userLocations?.clear?.(),
    ]);
  }

  /**
   * Returns true when IndexedDB contains data worth syncing.
   */
  static async hasData() {
    const count = await db.events.count();
    if (count > 0) return true;
    const prefCount = await db.definitionPreferences.count();
    if (prefCount > 0) return true;
    const userLocationCount = await (db.userLocations?.count?.() ?? 0);
    if (userLocationCount > 0) return true;
    const generationMeta = await db.generationMeta.get("generatedYearsRange");
    return generationMeta != null;
  }

  static async getUserLocations() {
    const records = await (db.userLocations?.toArray?.() ?? []);
    return {
      success: true,
      userLocations: records.map(({ id, ...rest }) => ({
        ...rest,
        userLocationId: id,
      })),
    };
  }

  static async createUserLocation(userLocation) {
    const now = new Date().toISOString();
    const id = await db.userLocations.add({
      ...userLocation,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, userLocation: { ...userLocation, userLocationId: id } };
  }

  static async updateUserLocation(userLocationId, updates) {
    await db.userLocations.update(userLocationId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    const record = await db.userLocations.get(userLocationId);
    if (!record) return { success: false, userLocation: null };
    const { id, ...rest } = record;
    return { success: true, userLocation: { ...rest, userLocationId: id } };
  }

  static async deleteUserLocation(userLocationId) {
    await db.userLocations.delete(userLocationId);
    return { success: true };
  }
}
