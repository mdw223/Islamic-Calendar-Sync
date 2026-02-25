/**
 * CalendarContext.jsx
 *
 * Provides calendar state (events, providers, view) to all child components.
 *
 * Data flow:
 *   1. On mount, events are loaded immediately from localStorage — no network
 *      request required, so the calendar renders instantly.
 *   2. Islamic events for the current Gregorian year are auto-generated and
 *      merged into localStorage if they haven't been generated yet.
 *   3. Providers are fetched from the API in the background (requires auth).
 *   4. The SYNC button (in Calendar.jsx) calls syncToBackend() — this batch-
 *      POSTs all unsynced Islamic events to the API and replaces their local
 *      string IDs with the backend's integer IDs.
 *   5. The REFRESH button calls refreshFromBackend() — this GETs all events
 *      from the API and merges them into localStorage (backend wins on conflicts
 *      for integer-keyed events; local-only string-keyed events are kept).
 *
 * localStorage keys used:
 *   "calendarView"         — persisted view preference (month / week / day)
 *   "calendarEvents"       — JSON array of all event objects
 *   "calendarGeneratedYears" — JSON array of Gregorian years already generated
 *   "islamicEventsDisabled"  — JSON array of definition IDs the user disabled
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import APIClient from "../util/ApiClient";
import { generateIslamicEventsForYear } from "../util/hijriUtils";
import {
  VIEW_STORAGE_KEY,
  VALID_VIEWS,
  EVENTS_KEY,
  GENERATED_YEARS_KEY,
  ISLAMIC_DEFS_KEY,
  ALL_DEFINITIONS,
} from "../constants";

// ---------------------------------------------------------------------------
// localStorage helpers — all reads/writes are wrapped so that JSON parse
// errors or missing keys are always handled gracefully.
// ---------------------------------------------------------------------------

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error(
      "localStorage may be unavailable in private browsing or when full. Error writing to localStorage for key: ",
      key,
      ". Error: ",
      error,
    );
  }
}

function getSavedView() {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY);
  return VALID_VIEWS.includes(saved) ? saved : "month";
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  // ── Events state ────────────────────────────────────────────────────────
  // Initialised directly from localStorage so the calendar renders
  // immediately without waiting for any async work.
  const [events, setEvents] = useState(() => readLS(EVENTS_KEY, []));

  // ── View preference ─────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState(getSavedView);

  // ── Providers (requires auth; loaded in background) ─────────────────────
  const [providers, setProviders] = useState([]);

  // ── Loading / error state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Sync / refresh in-flight flags ──────────────────────────────────────
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Islamic event definitions with isHidden flags ───────────────────────
  // Merged from the bundled JSON defaults and any persisted user preferences.
  // New definitions added to the JSON file are picked up automatically.
  const [islamicEventDefs, setIslamicEventDefs] = useState(() => {
    const stored = readLS(ISLAMIC_DEFS_KEY, null);
    if (stored) {
      // Merge: keep stored isHidden preferences, but pick up any new defs
      // from the bundled JSON that the user hasn't seen yet.
      const storedById = Object.fromEntries(stored.map((d) => [d.id, d]));
      return ALL_DEFINITIONS.map((def) =>
        storedById[def.id]
          ? { ...def, isHidden: storedById[def.id].isHidden }
          : { ...def },
      );
    }
    return ALL_DEFINITIONS.map((d) => ({ ...d }));
  });

  // ── Ref to always-current events (avoids stale closures in callbacks) ───
  // We keep a ref in sync with the `events` state so that async operations
  // that close over this ref always see the latest list.
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // ── On mount: load providers + ensure Islamic events for current year ───
  useEffect(() => {
    let cancelled = false;

    // Fetch providers in the background (non-blocking for the calendar UI).
    APIClient.getProviders()
      .then((data) => {
        if (!cancelled) setProviders(data?.providers ?? []);
      })
      .catch(() => {
        // Will be in network error anyways
      });

    // Ensure Islamic events for the current year are present in localStorage.
    ensureIslamicEventsForYear(new Date().getFullYear());

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Persist `nextEvents` to both React state and localStorage.
   * All mutations (add/update/remove/generate) go through this function to
   * keep state and storage always in sync.
   */
  function saveEvents(nextEvents) {
    setEvents(nextEvents);
    eventsRef.current = nextEvents;
    writeLS(EVENTS_KEY, nextEvents);
  }

  /**
   * Persist `nextDefs` to both React state and localStorage.
   */
  function saveDefs(nextDefs) {
    setIslamicEventDefs(nextDefs);
    writeLS(ISLAMIC_DEFS_KEY, nextDefs);
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Change the calendar view (month / week / day) and persist the preference.
   */
  function changeView(view) {
    if (!VALID_VIEWS.includes(view)) return;
    setCurrentView(view);
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }

  /**
   * Generate Islamic events for `year` if that year has not been processed yet.
   *
   * Called automatically on mount (current year) and whenever the user
   * navigates to a new year in Calendar.jsx.  Each Gregorian year generates
   * ~70 event objects that are merged into localStorage.  Already-present
   * events are identified by their `eventId` string and are never duplicated.
   *
   * Uses the current `islamicEventDefs` state — definitions with
   * `isHidden: true` are automatically skipped by the generator.
   *
   * @param {number} year - Gregorian year to ensure coverage for.
   */
  function ensureIslamicEventsForYear(year) {
    const generatedYears = readLS(GENERATED_YEARS_KEY, []);

    if (generatedYears.includes(year)) return; // already done

    const currentDefs = readLS(ISLAMIC_DEFS_KEY, null) ?? ALL_DEFINITIONS;
    const newEvents = generateIslamicEventsForYear(year, currentDefs);

    if (newEvents.length === 0) {
      // Even if nothing was generated (all hidden), mark the year so we
      // don't re-enter this function on every navigation.
      writeLS(GENERATED_YEARS_KEY, [...generatedYears, year]);
      return;
    }

    // Merge: skip events that already exist in localStorage (by eventId or
    // islamicEventKey, since synced events have an integer eventId that won't
    // match the generated string ID).
    const existing = readLS(EVENTS_KEY, []);
    const existingIds = new Set(existing.map((e) => String(e.eventId)));
    const existingKeys = new Set(
      existing.map((e) => e.islamicEventKey).filter(Boolean),
    );
    const toAdd = newEvents.filter(
      (e) =>
        !existingIds.has(String(e.eventId)) &&
        !existingKeys.has(e.islamicEventKey),
    );

    const merged = [...existing, ...toAdd];
    saveEvents(merged);
    writeLS(GENERATED_YEARS_KEY, [...generatedYears, year]);
  }

  /**
   * Toggle a single Islamic event definition's `isHidden` flag.
   *
   * When showing (isHidden → false):
   *   - Flip the flag and persist the definitions list.
   *   - Re-generate events for all already-processed Gregorian years so the
   *     newly-shown event appears in past/future views.
   *
   * When hiding (isHidden → true):
   *   - Flip the flag and persist the definitions list.
   *   - Remove all generated events whose `islamicDefinitionId` matches.
   *
   * @param {string} definitionId - The `id` field from islamicEvents.json.
   */
  function toggleIslamicEvent(definitionId) {
    const currentDefs = readLS(ISLAMIC_DEFS_KEY, null) ?? ALL_DEFINITIONS;
    const target = currentDefs.find((d) => d.id === definitionId);
    if (!target) return;

    const wasHidden = target.isHidden;

    // Flip the bit and persist.
    const nextDefs = currentDefs.map((d) =>
      d.id === definitionId ? { ...d, isHidden: !d.isHidden } : d,
    );
    saveDefs(nextDefs);

    if (wasHidden) {
      // Was hidden → now visible: re-generate for all processed years.
      const generatedYears = readLS(GENERATED_YEARS_KEY, []);

      for (const year of generatedYears) {
        const newEvents = generateIslamicEventsForYear(year, nextDefs);
        const existing = readLS(EVENTS_KEY, []);
        const existingIds = new Set(existing.map((e) => String(e.eventId)));
        const toAdd = newEvents.filter(
          (e) => !existingIds.has(String(e.eventId)),
        );
        if (toAdd.length > 0) {
          saveEvents([...existing, ...toAdd]);
        }
      }
    } else {
      // Was visible → now hidden: remove all instances from events.
      const existing = readLS(EVENTS_KEY, []);
      const filtered = existing.filter(
        (e) => e.islamicDefinitionId !== definitionId,
      );
      saveEvents(filtered);
    }
  }

  /**
   * Add a new event.
   *
   * For authenticated users the event is immediately POST-ed to the API and
   * stored with the server's integer eventId. For unauthenticated users (or
   * when the API call fails), the event is stored locally with a temporary
   * string ID.
   *
   * @param {Object} eventData - Fields matching the API's createEvent schema.
   * @returns {Promise<Object>} The created event object.
   */
  async function addEvent(eventData) {
    try {
      // Attempt to persist to the backend immediately.
      const res = await APIClient.createEvent(eventData);
      const created = res?.event ?? res;
      const next = [created, ...eventsRef.current];
      saveEvents(next);
      return created;
    } catch {
      // If the API is unavailable or the user is not authenticated, fall back
      // to a local-only event with a timestamp-based string ID.
      const localEvent = {
        ...eventData,
        eventId: `local_${Date.now()}`,
      };
      const next = [localEvent, ...eventsRef.current];
      saveEvents(next);
      return localEvent;
    }
  }

  /**
   * Update an existing event by its ID (integer or string).
   *
   * @param {number|string} eventId
   * @param {Object} updates
   * @returns {Promise<Object>} The updated event object.
   */
  async function updateEvent(eventId, updates) {
    if (typeof eventId === "number") {
      // Synced event — update the backend, then reflect in local state.
      const res = await APIClient.updateEvent(eventId, updates);
      const updated = res?.event ?? res;
      const next = eventsRef.current.map((e) =>
        e.eventId === eventId ? updated : e,
      );
      saveEvents(next);
      return updated;
    } else {
      // Local-only event — update in place without hitting the network.
      const updated = {
        ...eventsRef.current.find((e) => e.eventId === eventId),
        ...updates,
      };
      const next = eventsRef.current.map((e) =>
        e.eventId === eventId ? updated : e,
      );
      saveEvents(next);
      return updated;
    }
  }

  /**
   * Delete an event by its ID (integer or string).
   *
   * @param {number|string} eventId
   */
  async function removeEvent(eventId) {
    if (typeof eventId === "number") {
      // Synced event — remove from the backend first.
      await APIClient.deleteEvent(eventId);
    }
    const next = eventsRef.current.filter((e) => e.eventId !== eventId);
    saveEvents(next);
  }

  /**
   * Sync all unsynced Islamic events to the backend.
   *
   * "Unsynced" means `eventId` is a string (local-only); synced events have
   * an integer `eventId` assigned by the backend.
   *
   * The batch endpoint performs upserts keyed on `(userId, islamicEventKey)`
   * so calling this multiple times is safe — no duplicates are created.
   *
   * After a successful sync, each returned event's integer `eventId` replaces
   * the temporary string ID in localStorage, and subsequent syncs will skip
   * those events.
   */
  async function syncToBackend() {
    // Collect events that have a string eventId (never been synced).
    const unsynced = eventsRef.current.filter(
      (e) => typeof e.eventId === "string" && e.islamicEventKey,
    );

    if (unsynced.length === 0) return;

    setIsSyncing(true);
    setError(null);
    try {
      const res = await APIClient.bulkCreateEvents(unsynced);
      const synced = res?.events ?? [];

      // Build a lookup from islamicEventKey → backend integer eventId so we
      // can update the correct local records.
      const keyToBackendId = {};
      for (const event of synced) {
        if (event.islamicEventKey) {
          keyToBackendId[event.islamicEventKey] = event.eventId;
        }
      }

      // Replace string IDs with the authoritative backend IDs.
      const next = eventsRef.current.map((e) => {
        if (
          typeof e.eventId === "string" &&
          e.islamicEventKey &&
          keyToBackendId[e.islamicEventKey] != null
        ) {
          return { ...e, eventId: keyToBackendId[e.islamicEventKey] };
        }
        return e;
      });

      saveEvents(next);
    } catch (err) {
      setError(err.message ?? "Failed to sync events");
    } finally {
      setIsSyncing(false);
    }
  }

  /**
   * Refresh events from the backend.
   *
   * Fetches all events for the authenticated user and merges them into
   * localStorage. The backend is the source of truth for events with integer
   * IDs. Local-only events (string IDs) are preserved so unsaved work is
   * not lost.
   */
  async function refreshFromBackend() {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await APIClient.getEvents();
      const backendEvents = res?.events ?? [];

      // Build a set of backend integer IDs for fast lookup.
      const backendIdSet = new Set(backendEvents.map((e) => e.eventId));

      // Keep local-only events (string IDs) that the backend doesn't know about.
      const localOnly = eventsRef.current.filter(
        (e) => typeof e.eventId === "string",
      );

      // Preserve local-side fields that the backend strips (islamicDefinitionId).
      const localByKey = {};
      for (const e of eventsRef.current) {
        if (e.islamicEventKey) localByKey[e.islamicEventKey] = e;
      }

      const merged = [
        // Backend events enriched with any locally-stored extra fields.
        ...backendEvents.map((be) => {
          const local = be.islamicEventKey
            ? localByKey[be.islamicEventKey]
            : null;
          return local ? { ...local, ...be } : be;
        }),
        // Local-only events that the backend has no record of yet.
        ...localOnly.filter((e) => !backendIdSet.has(e.eventId)),
      ];

      saveEvents(merged);
    } catch (err) {
      setError(err.message ?? "Failed to refresh events");
    } finally {
      setIsRefreshing(false);
    }
  }

  // ── Context value ────────────────────────────────────────────────────────

  return (
    <CalendarContext.Provider
      value={{
        events,
        providers,
        currentView,
        changeView,
        loading,
        error,

        // Event CRUD
        addEvent,
        updateEvent,
        removeEvent,

        // Islamic event definitions (with isHidden flags)
        islamicEventDefs,
        toggleIslamicEvent,
        ensureIslamicEventsForYear,

        // Backend sync / refresh
        syncToBackend,
        refreshFromBackend,
        isSyncing,
        isRefreshing,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendar must be used within CalendarProvider");
  return ctx;
}

export { CalendarContext };
