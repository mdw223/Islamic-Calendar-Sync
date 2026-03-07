/**
 * CalendarContext.jsx
 *
 * API-first calendar state management. All events are persisted server-side.
 * Both guest users (HMAC-signed session cookie) and registered users (JWT)
 * have a userId, so all API calls work for everyone.
 *
 * Data flow:
 *   1. On mount (once user is available), events + definitions are loaded from
 *      the API.
 *   2. Islamic events are generated server-side via POST /events/generate.
 *      The backend's upsert guarantees idempotency.
 *   3. All CRUD operations go through the API — no localStorage for events.
 *   4. Definition show/hide preferences are stored server-side in the
 *      UserIslamicDefinitionPreference table.
 *   5. Providers are fetched in the background.
 *
 * localStorage keys still used:
 *   "calendarView" — UI preference (month / week / day)
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
import { getSavedView } from "../util/localStorage";
import { CALENDAR_VIEW_KEY, VALID_VIEWS } from "../Constants";

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  // ── User (guest or registered — always has a userId after mount) ────────
  const { user } = useUser();

  // ── Events state ────────────────────────────────────────────────────────
  // Starts empty; populated from GET /events once the user is available.
  const [events, setEvents] = useState([]);

  // ── View preference ─────────────────────────────────────────────────────
  const [currentView, setCurrentView] = useState(getSavedView);

  // ── Calendar Providers (loaded in background) ───────────────────────────
  const [calendarProviders, setCalendarProviders] = useState([]);

  // ── Loading / error state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Refresh in-flight flag ──────────────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Islamic event definitions (loaded from API) ─────────────────────────
  const [islamicEventDefs, setIslamicEventDefs] = useState([]);

  // ── Track which years have been generated this session ──────────────────
  const generatedYearsRef = useRef(new Set());

  // ── Ref to always-current events (avoids stale closures in callbacks) ───
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // ── On mount (and when user changes): load events + definitions from API ─
  useEffect(() => {
    if (!user?.userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    generatedYearsRef.current = new Set();

    (async () => {
      try {
        // Fetch events and definitions from the API in parallel.
        const [eventsRes, defsRes] = await Promise.all([
          APIClient.getEvents(),
          APIClient.getDefinitions(),
        ]);
        if (cancelled) return;

        const serverEvents = eventsRes?.events ?? [];
        setEvents(serverEvents);
        eventsRef.current = serverEvents;

        const defs = defsRes?.definitions ?? [];
        setIslamicEventDefs(defs);

        // Ensure Islamic events for the current year exist on the server.
        await ensureIslamicEventsForYearInternal(new Date().getFullYear());
      } catch {
        if (!cancelled) {
          setEvents([]);
          eventsRef.current = [];
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Fetch calendar providers in the background (non-blocking).
    APIClient.getCalendarProviders()
      .then((data) => {
        if (!cancelled) setCalendarProviders(data?.calendarProviders ?? []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  /**
   * Update React state for events.
   */
  function saveEvents(nextEvents) {
    setEvents(nextEvents);
    eventsRef.current = nextEvents;
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
   * Internal helper — ask the backend to generate Islamic events for `year`.
   * The backend's upsert handles idempotency. We track generated years
   * in-memory to avoid redundant network calls within the same session.
   */
  async function ensureIslamicEventsForYearInternal(year) {
    if (!user?.userId) return;
    if (generatedYearsRef.current.has(year)) return;

    try {
      const res = await APIClient.generateEvents(year);
      generatedYearsRef.current.add(year);

      // If new events were created, merge them into state.
      const generated = res?.events ?? [];
      if (generated.length > 0) {
        const existingKeys = new Set(
          eventsRef.current.map((e) => e.islamicEventKey).filter(Boolean),
        );
        const newEvents = generated.filter(
          (e) => e.islamicEventKey && !existingKeys.has(e.islamicEventKey),
        );
        if (newEvents.length > 0) {
          saveEvents([...eventsRef.current, ...newEvents]);
        }
      }
    } catch {
      // Don't mark year as generated so it retries next time.
    }
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
   * Fetch the latest event data from the backend and update context.
   * Use this before opening an event modal to ensure fresh data.
   *
   * @param {number} eventId
   * @returns {Promise<Object>} The refreshed event object.
   */
  async function refreshEventData(eventId) {
    try {
      const res = await APIClient.getEventById(eventId);
      const updated = res?.event ?? res;
      const next = eventsRef.current.map((e) =>
        e.eventId === eventId ? updated : e,
      );
      saveEvents(next);
      return updated;
    } catch (err) {
      setError(err.message ?? "Failed to refresh event");
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
   * Sends a single API call that updates the preference and all matching
   * events server-side.
   *
   * @param {string} definitionId - The `id` field from the definition.
   */
  async function toggleIslamicEvent(definitionId) {
    const target = islamicEventDefs.find((d) => d.id === definitionId);
    if (!target) return;

    const wasHidden = target.isHidden;
    const newHidden = !wasHidden;

    // Optimistic local update — definitions.
    setIslamicEventDefs((prev) =>
      prev.map((d) =>
        d.id === definitionId ? { ...d, isHidden: newHidden } : d,
      ),
    );

    // Optimistic local update — events.
    const updated = eventsRef.current.map((e) =>
      e.islamicDefinitionId === definitionId ? { ...e, hide: newHidden } : e,
    );
    saveEvents(updated);

    // Persist to the server (single API call).
    try {
      await APIClient.updateDefinitionPreference(definitionId, newHidden);
    } catch {
      // Revert on failure.
      setIslamicEventDefs((prev) =>
        prev.map((d) =>
          d.id === definitionId ? { ...d, isHidden: wasHidden } : d,
        ),
      );
      const reverted = eventsRef.current.map((e) =>
        e.islamicDefinitionId === definitionId ? { ...e, hide: wasHidden } : e,
      );
      saveEvents(reverted);
    }
  }

  /**
   * Reset the calendar — deletes all events on the server, reloads fresh
   * definitions, then re-generates Islamic events.
   */
  async function resetCalendar() {
    // Delete all current events from the server.
    await Promise.allSettled(
      eventsRef.current
        .filter((e) => typeof e.eventId === "number")
        .map((e) => APIClient.deleteEvent(e.eventId)),
    );

    // Reset local state.
    saveEvents([]);
    generatedYearsRef.current = new Set();

    // Reload definitions from server (resets preferences).
    try {
      const defsRes = await APIClient.getDefinitions();
      setIslamicEventDefs(defsRes?.definitions ?? []);
    } catch {
      setIslamicEventDefs([]);
    }

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
        calendarProviders,
        currentView,
        changeView,
        loading,
        error,

        // Event CRUD
        addEvent,
        updateEvent,
        removeEvent,
        refreshEventData,

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
