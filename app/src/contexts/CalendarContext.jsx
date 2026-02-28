/**
 * CalendarContext.jsx
 *
 * API-first calendar state management. All events are persisted server-side.
 * Both guest users (HMAC-signed session cookie) and registered users (JWT)
 * have a userId, so all API calls work for everyone.
 *
 * Data flow:
 *   1. On mount (once user is available), events are loaded from GET /events.
 *   2. Islamic events for the current Gregorian year are auto-generated
 *      client-side and batch-POSTed to the API if not already present.
 *   3. All CRUD operations go through the API — no localStorage for events.
 *   4. Providers are fetched in the background.
 *
 * localStorage keys still used:
 *   "calendarView"                     — UI preference (month / week / day)
 *   "islamicEventDefs"                 — definition show/hide preferences (UI toggles)
 *   "calendarGeneratedYears_<userId>"  — per-user tracking of generated years
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import APIClient from "../util/ApiClient";
import { useUser } from "./UserContext";
import { generateIslamicEventsForYear } from "../util/hijriUtils";
import { readLS, writeLS, getSavedView } from "../util/localStorage";
import {
  CALENDAR_VIEW_KEY,
  VALID_VIEWS,
  GENERATED_YEARS_KEY,
  ISLAMIC_DEFS_KEY,
  ALL_DEFINITIONS,
} from "../constants";

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  // ── User (guest or registered — always has a userId after mount) ────────
  const { user } = useUser();

  // ── Events state ────────────────────────────────────────────────────────
  // Starts empty; populated from GET /events once the user is available.
  const [events, setEvents] = useState([]);

  // ── View preference ─────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState(getSavedView);

  // ── Providers (loaded in background) ────────────────────────────────────
  const [providers, setProviders] = useState([]);

  // ── Loading / error state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Refresh in-flight flag ──────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);

  // New Islamic event definitions added to the JSON file are picked up automatically.
  const [islamicEventDefs, setIslamicEventDefs] = useState(() => {
    const stored = readLS(ISLAMIC_DEFS_KEY, null);
    if (stored) {
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
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // ── On mount (and when user changes): load events from API ──────────────
  useEffect(() => {
    if (!user?.userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Fetch events from the API (works for both guest and registered users).
        const res = await APIClient.getEvents();
        if (cancelled) return;
        const serverEvents = res?.events ?? [];
        setEvents(serverEvents);
        eventsRef.current = serverEvents;

        // Ensure Islamic events for the current year exist on the server.
        await ensureIslamicEventsForYearInternal(
          new Date().getFullYear(),
          serverEvents,
        );
      } catch {
        if (!cancelled) {
          setEvents([]);
          eventsRef.current = [];
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Fetch providers in the background (non-blocking).
    APIClient.getProviders()
      .then((data) => {
        if (!cancelled) setProviders(data?.providers ?? []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Update React state for events (no localStorage for events).
   */
  function saveEvents(nextEvents) {
    setEvents(nextEvents);
    eventsRef.current = nextEvents;
  }

  /**
   * Persist definition preferences to localStorage.
   */
  function saveDefs(nextDefs) {
    setIslamicEventDefs(nextDefs);
    writeLS(ISLAMIC_DEFS_KEY, nextDefs);
  }

  /**
   * Change the calendar view (month / week / day) and persist the preference.
   */
  function changeView(view) {
    if (!VALID_VIEWS.includes(view)) return;
    setCurrentView(view);
    localStorage.setItem(CALENDAR_VIEW_KEY, view);
  }

  /**
   * Internal helper — generate Islamic events for `year` and batch-POST
   * any that are not yet on the server.  Accepts an optional `existing`
   * array so the mount effect can pass the just-fetched events.
   */
  async function ensureIslamicEventsForYearInternal(year, existing = null) {
    const userId = user?.userId;
    if (!userId) return;

    const key = `${GENERATED_YEARS_KEY}_${userId}`;
    const generatedYears = readLS(key, []);
    if (generatedYears.includes(year)) return;

    const currentDefs = readLS(ISLAMIC_DEFS_KEY, null) ?? ALL_DEFINITIONS;
    const newEvents = generateIslamicEventsForYear(year, currentDefs);

    if (newEvents.length === 0) {
      writeLS(key, [...generatedYears, year]);
      return;
    }

    // Filter out events that already exist on the server (by islamicEventKey).
    const current = existing ?? eventsRef.current;
    const existingKeys = new Set(
      current.map((e) => e.islamicEventKey).filter(Boolean),
    );
    const toAdd = newEvents.filter(
      (e) => e.islamicEventKey && !existingKeys.has(e.islamicEventKey),
    );

    if (toAdd.length === 0) {
      writeLS(key, [...generatedYears, year]);
      return;
    }

    try {
      const res = await APIClient.bulkCreateEvents(toAdd);
      const created = res?.events ?? [];
      const next = [...eventsRef.current, ...created];
      saveEvents(next);
    } catch {
      // Don't mark year as generated so it retries next time.
      return;
    }

    writeLS(key, [...generatedYears, year]);
  }

  /**
   * Public wrapper — called by Calendar.jsx when navigating to a new year.
   */
  async function ensureIslamicEventsForYear(year) {
    await ensureIslamicEventsForYearInternal(year);
  }

  /**
   * Add a new event via the API.
   *
   * @param {Object} eventData - Fields matching the API's createEvent schema.
   * @returns {Promise<Object>} The created event object.
   */
  async function addEvent(eventData) {
    try {
      const res = await APIClient.createEvent(eventData);
      const created = res?.event ?? res;
      const next = [created, ...eventsRef.current];
      saveEvents(next);
      return created;
    } catch (err) {
      setError(err.message ?? "Failed to create event");
      throw err;
    }
  }

  /**
   * Update an existing event via the API.
   *
   * @param {number} eventId
   * @param {Object} updates
   * @returns {Promise<Object>} The updated event object.
   */
  async function updateEvent(eventId, updates) {
    try {
      const res = await APIClient.updateEvent(eventId, updates);
      const updated = res?.event ?? res;
      const next = eventsRef.current.map((e) =>
        e.eventId === eventId ? updated : e,
      );
      saveEvents(next);
      return updated;
    } catch (err) {
      setError(err.message ?? "Failed to update event");
      throw err;
    }
  }

  /**
   * Delete an event via the API.
   *
   * @param {number} eventId
   */
  async function removeEvent(eventId) {
    try {
      await APIClient.deleteEvent(eventId);
      const next = eventsRef.current.filter((e) => e.eventId !== eventId);
      saveEvents(next);
    } catch (err) {
      setError(err.message ?? "Failed to delete event");
      throw err;
    }
  }

  /**
   * No-op — kept for backwards compatibility.
   * With API-first architecture all writes already go through the API.
   */
  async function syncToBackend() {
    return { ok: true };
  }

  /**
   * Reload events from the server (manual refresh).
   */
  async function refreshFromBackend() {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await APIClient.getEvents();
      const serverEvents = res?.events ?? [];
      saveEvents(serverEvents);
      return { ok: true };
    } catch (err) {
      const msg = err.message ?? "Failed to refresh events";
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setIsRefreshing(false);
    }
  }

  /**
   * Toggle a single Islamic event definition's `isHidden` flag.
   * Updates matching events on the server.
   *
   * @param {string} definitionId - The `id` field from islamicEvents.json.
   */
  async function toggleIslamicEvent(definitionId) {
    const currentDefs = readLS(ISLAMIC_DEFS_KEY, null) ?? ALL_DEFINITIONS;
    const target = currentDefs.find((d) => d.id === definitionId);
    if (!target) return;

    const wasHidden = target.isHidden;

    // Flip the bit and persist definition preference.
    const nextDefs = currentDefs.map((d) =>
      d.id === definitionId ? { ...d, isHidden: !d.isHidden } : d,
    );
    saveDefs(nextDefs);

    // Update hide flag on matching events (optimistic local update).
    const matching = eventsRef.current.filter(
      (e) => e.islamicDefinitionId === definitionId,
    );
    const updated = eventsRef.current.map((e) =>
      e.islamicDefinitionId === definitionId ? { ...e, hide: !wasHidden } : e,
    );
    saveEvents(updated);

    // Persist hide changes to the server in parallel.
    await Promise.allSettled(
      matching
        .filter((e) => typeof e.eventId === "number")
        .map((e) => APIClient.updateEvent(e.eventId, { hide: !wasHidden })),
    );
  }

  /**
   * Reset the calendar — deletes all events on the server, clears generated-
   * year tracking and definition preferences, then re-generates Islamic events.
   */
  async function resetCalendar() {
    // Clear definition preferences.
    writeLS(ISLAMIC_DEFS_KEY, null);
    const userId = user?.userId;
    if (userId) {
      writeLS(`${GENERATED_YEARS_KEY}_${userId}`, []);
    }

    // Delete all current events from the server.
    await Promise.allSettled(
      eventsRef.current
        .filter((e) => typeof e.eventId === "number")
        .map((e) => APIClient.deleteEvent(e.eventId)),
    );

    // Reset React state.
    const defaultDefs = ALL_DEFINITIONS.map((d) => ({ ...d }));
    saveEvents([]);
    setIslamicEventDefs(defaultDefs);
    saveDefs(defaultDefs);

    // Re-generate for the current year.
    await ensureIslamicEventsForYearInternal(new Date().getFullYear());
  }

  // ── Derived state ───────────────────────────────────────────────────────
  const visibleEvents = useMemo(() => events.filter((e) => !e.hide), [events]);

  // ── Context value ────────────────────────────────────────────────────────

  return (
    <CalendarContext.Provider
      value={{
        events: visibleEvents,
        allEvents: events,
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

        // Backend sync / refresh (syncToBackend is now a no-op)
        syncToBackend,
        refreshFromBackend,
        isSyncing: false,
        isRefreshing,

        // Reset
        resetCalendar,
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
