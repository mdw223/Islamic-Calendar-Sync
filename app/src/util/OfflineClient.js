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

export default class OfflineClient {
  // ── Events ─────────────────────────────────────────────────────────────

  static async getEvents() {
    const events = await db.events.toArray();
    return { success: true, events };
  }

  static async getEventById(eventId) {
    const event = await db.events.get(eventId);
    return { success: true, event: event ?? null };
  }

  static async createEvent(eventData) {
    const now = new Date().toISOString();
    const record = {
      ...eventData,
      isCustom: eventData.isCustom ?? true,
      isTask: eventData.isTask ?? false,
      hide: eventData.hide ?? false,
      islamicEventKey: eventData.islamicEventKey ?? null,
      islamicDefinitionId: eventData.islamicDefinitionId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.events.add(record);
    return { success: true, event: { ...record, id } };
  }

  static async updateEvent(eventId, updates) {
    const now = new Date().toISOString();
    await db.events.update(eventId, { ...updates, updatedAt: now });
    const event = await db.events.get(eventId);
    return { success: true, event };
  }

  static async deleteEvent(eventId) {
    await db.events.delete(eventId);
    return { success: true };
  }

  // ── Islamic event generation ───────────────────────────────────────────

  static async generateEvents(year) {
    return generateForOfflineUser(year);
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
    const [events, preferences] = await Promise.all([
      db.events.toArray(),
      db.definitionPreferences.toArray(),
    ]);

    if (events.length === 0 && preferences.length === 0) return null;

    return {
      // Strip local auto-increment `id` — backend assigns real EventId.
      events: events.map(({ id, createdAt, updatedAt, ...rest }) => rest),
      preferences,
    };
  }

  /**
   * Wipe all offline data after a successful sync.
   */
  static async clearAll() {
    await Promise.all([
      db.events.clear(),
      db.definitionPreferences.clear(),
    ]);
  }

  /**
   * Returns true when IndexedDB contains data worth syncing.
   */
  static async hasData() {
    const count = await db.events.count();
    if (count > 0) return true;
    const prefCount = await db.definitionPreferences.count();
    return prefCount > 0;
  }
}
