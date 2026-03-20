/**
 * CalendarContext.jsx
 *
 * Calendar state management — API-first with offline fallback:
 *   • All operations target APIClient first.
 *   • If a request fails due to being offline (network error) or
 *     unauthenticated (401/403), the operation falls back to
 *     OfflineClient (IndexedDB) so data is cached locally.
 *   • On the next successful login, UserContext.syncOfflineData()
 *     pushes cached IndexedDB data to the server and clears it.
 *
 * Data flow:
 *   1. On mount (once user is available), load events + definitions
 *      from the API; fall back to IndexedDB on failure.
 *   2. Islamic events are generated server-side (POST /events/generate)
 *      for authenticated users, or client-side when offline/unauth.
 *   3. Definition show/hide preferences are stored server-side; falls
 *      back to Dexie when the server is unreachable.
 *   4. Providers are fetched in the background (auth only).
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
import OfflineClient from "../util/OfflineClient";
import { shouldFallbackToOffline } from "../util/ApiErrorHelper";
import { useUser } from "./UserContext";
import { getSavedView } from "../util/LocalStorage";
import { CALENDAR_VIEW_KEY, VALID_VIEWS } from "../Constants";

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  // ── User ────────────────────────────────────────────────────────────────
  const { user } = useUser();

  // ── Events state ────────────────────────────────────────────────────────
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

  // ── Derived auth check ─────────────────────────────────────────────────
  const isAuth = !!user?.userId;

  // ── On mount (and when user changes): load events + definitions ─────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    generatedYearsRef.current = new Set();

    (async () => {
      try {
        if (isAuth) {
          // Authenticated — load from API, fall back to IndexedDB.
          let eventsRes, defsRes;
          try {
            [eventsRes, defsRes] = await Promise.all([
              APIClient.getEvents(),
              APIClient.getDefinitions(),
            ]);
          } catch (err) {
            if (shouldFallbackToOffline(err)) {
              [eventsRes, defsRes] = await Promise.all([
                OfflineClient.getEvents(),
                OfflineClient.getDefinitions(),
              ]);
            } else {
              throw err;
            }
          }
          if (cancelled) return;

          const loaded = eventsRes?.events ?? [];
          setEvents(loaded);
          eventsRef.current = loaded;
          setIslamicEventDefs(defsRes?.definitions ?? []);
        } else {
          // Not authenticated — check IndexedDB for cached data.
          const hasData = await OfflineClient.hasData();
          if (hasData) {
            const [eventsRes, defsRes] = await Promise.all([
              OfflineClient.getEvents(),
              OfflineClient.getDefinitions(),
            ]);
            if (cancelled) return;

            const loaded = eventsRes?.events ?? [];
            setEvents(loaded);
            eventsRef.current = loaded;
            setIslamicEventDefs(defsRes?.definitions ?? []);

            // await ensureIslamicEventsForYearInternal(new Date().getFullYear());
          } else {
            if (cancelled) return;
            setEvents([]);
            eventsRef.current = [];
            setIslamicEventDefs([]);
            setCalendarProviders([]);
          }
        }
      } catch {
        if (!cancelled) {
          setEvents([]);
          eventsRef.current = [];
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Calendar providers — auth users only.
    if (isAuth) {
      APIClient.getCalendarProviders()
        .then((data) => {
          if (!cancelled) setCalendarProviders(data?.calendarProviders ?? []);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  // ── Helpers ─────────────────────────────────────────────────────────────

  function saveEvents(nextEvents) {
    setEvents(nextEvents);
    eventsRef.current = nextEvents;
  }

  function changeView(view) {
    if (!VALID_VIEWS.includes(view)) return;
    setCurrentView(view);
    localStorage.setItem(CALENDAR_VIEW_KEY, view);
  }

  /**
   * Generate Islamic events for the given years (skipping already-generated ones).
   * Tries API first, falls back to OfflineClient on failure.
   *
   * @param {number[]} years - Array of Gregorian years.
   */
  async function ensureIslamicEventsForYears(years) {
    const needed = years.filter((y) => !generatedYearsRef.current.has(y));
    if (needed.length === 0) return;

    try {
      let res;
      try {
        res = await APIClient.generateEvents(needed);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.generateEvents(needed);
        } else {
          throw err;
        }
      }
      for (const y of needed) generatedYearsRef.current.add(y);

      const generated = res?.events ?? [];
      if (generated.length > 0) {
        saveEvents([...eventsRef.current, ...generated]);
      }
    } catch {
      // Don't mark years as generated so they retry next time.
    }
  }

  /**
   * Add a new event. Tries API first; falls back to IndexedDB on
   * network failure or auth error.
   */
  async function addEvent(eventData) {
    try {
      let res;
      try {
        res = await APIClient.createEvent(eventData);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.createEvent(eventData);
        } else {
          throw err;
        }
      }
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
   */
  async function refreshEventData(eventId) {
    try {
      let res;
      try {
        res = await APIClient.getEventById(eventId);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.getEventById(eventId);
        } else {
          throw err;
        }
      }
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
   * Update an existing event. Tries API first; falls back to IndexedDB.
   */
  async function updateEvent(eventId, updates) {
    try {
      let res;
      try {
        res = await APIClient.updateEvent(eventId, updates);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.updateEvent(eventId, updates);
        } else {
          throw err;
        }
      }
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
   * Delete an event. Tries API first; falls back to IndexedDB.
   */
  async function removeEvent(eventId) {
    try {
      try {
        await APIClient.deleteEvent(eventId);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          await OfflineClient.deleteEvent(eventId);
        } else {
          throw err;
        }
      }
      const next = eventsRef.current.filter((e) => e.eventId !== eventId);
      saveEvents(next);
    } catch (err) {
      setError(err.message ?? "Failed to delete event");
      throw err;
    }
  }

  async function syncToBackend() {
    return { ok: true };
  }

  /**
   * Reload events from the data source (manual refresh).
   * Tries API first; falls back to IndexedDB.
   */
  async function refreshFromBackend() {
    setIsRefreshing(true);
    setError(null);
    try {
      let res;
      try {
        res = await APIClient.getEvents();
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.getEvents();
        } else {
          throw err;
        }
      }
      const refreshed = res?.events ?? [];
      saveEvents(refreshed);
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
   * Optimistic update with API-first persistence; falls back to IndexedDB.
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

    try {
      try {
        await APIClient.updateDefinitionPreference(definitionId, newHidden);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          await OfflineClient.updateDefinitionPreference(
            definitionId,
            newHidden,
          );
        } else {
          throw err;
        }
      }
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
   * Reset the calendar — deletes all events, reloads fresh definitions,
   * Tries API first; falls back to IndexedDB.
   */
  async function resetCalendar() {
    try {
      await APIClient.deleteAllEvents();
    } catch {
      await OfflineClient.clearAll();
    }

    // Reset local state.
    saveEvents([]);
    generatedYearsRef.current = new Set();

    // Reload definitions.
    try {
      let defsRes;
      try {
        defsRes = await APIClient.getDefinitions();
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          defsRes = await OfflineClient.getDefinitions();
        } else {
          throw err;
        }
      }
      setIslamicEventDefs(defsRes?.definitions ?? []);
    } catch {
      setIslamicEventDefs([]);
    }
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
        ensureIslamicEventsForYears,

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
