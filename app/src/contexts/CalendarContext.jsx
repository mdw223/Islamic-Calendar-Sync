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
import { createUser } from "../models/User";
import { getDefaultEventsQueryRange } from "../util/CalendarEventRange";

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  // ── User ────────────────────────────────────────────────────────────────
  const { user, setUser } = useUser();

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

  // ── Persisted generated-year coverage range ─────────────────────────────
  const [generatedYearsRange, setGeneratedYearsRange] = useState({
    start: null,
    end: null,
  });

  // ── Ref to always-current events (avoids stale closures in callbacks) ───
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const genRangeRef = useRef(generatedYearsRange);
  useEffect(() => {
    genRangeRef.current = generatedYearsRange;
  }, [generatedYearsRange]);

  function eventsQueryRange(overrides = {}) {
    return getDefaultEventsQueryRange({
      generatedYearsStart:
        overrides.generatedYearsStart ??
        genRangeRef.current.start ??
        userRef.current?.generatedYearsStart ??
        null,
      generatedYearsEnd:
        overrides.generatedYearsEnd ??
        genRangeRef.current.end ??
        userRef.current?.generatedYearsEnd ??
        null,
    });
  }

  // ── Derived auth check ─────────────────────────────────────────────────
  const isAuth = !!user?.userId;

  // ── On mount (and when user changes): load events + definitions ─────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setGeneratedYearsRange({
      start: user?.generatedYearsStart ?? null,
      end: user?.generatedYearsEnd ?? null,
    });

    (async () => {
      try {
        if (isAuth) {
          // Authenticated — load from API, fall back to IndexedDB.
          const evRange = getDefaultEventsQueryRange({
            generatedYearsStart: user?.generatedYearsStart ?? null,
            generatedYearsEnd: user?.generatedYearsEnd ?? null,
          });
          let eventsRes, defsRes;
          try {
            [eventsRes, defsRes] = await Promise.all([
              APIClient.getEvents(evRange),
              APIClient.getDefinitions(),
            ]);
          } catch (err) {
            if (shouldFallbackToOffline(err)) {
              [eventsRes, defsRes] = await Promise.all([
                OfflineClient.getEvents(evRange),
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
          setGeneratedYearsRange({
            start: user?.generatedYearsStart ?? null,
            end: user?.generatedYearsEnd ?? null,
          });
        } else {
          // Not authenticated — check IndexedDB for cached data.
          const hasData = await OfflineClient.hasData();
          if (hasData) {
            const yearsRange = await OfflineClient.getGeneratedYearsRange();
            const evRange = getDefaultEventsQueryRange({
              generatedYearsStart: yearsRange?.generatedYearsStart ?? null,
              generatedYearsEnd: yearsRange?.generatedYearsEnd ?? null,
            });
            const [eventsRes, defsRes] = await Promise.all([
              OfflineClient.getEvents(evRange),
              OfflineClient.getDefinitions(),
            ]);
            if (cancelled) return;

            const loaded = eventsRes?.events ?? [];
            setEvents(loaded);
            eventsRef.current = loaded;
            setIslamicEventDefs(defsRes?.definitions ?? []);
            setGeneratedYearsRange({
              start: yearsRange?.generatedYearsStart ?? null,
              end: yearsRange?.generatedYearsEnd ?? null,
            });
          } else {
            if (cancelled) return;
            setEvents([]);
            eventsRef.current = [];
            setIslamicEventDefs([]);
            setCalendarProviders([]);
            setGeneratedYearsRange({ start: null, end: null });
          }
        }
      } catch {
        if (!cancelled) {
          setEvents([]);
          eventsRef.current = [];
          setGeneratedYearsRange({ start: null, end: null });
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
  async function ensureIslamicEventsForYears(years, options = {}) {
    const requestedYears = [...new Set(years)].filter((y) =>
      Number.isInteger(y),
    );
    if (requestedYears.length === 0) return;

    const timezone = options?.timezone ?? null;
    const includeAll = options?.includeAll === true;

    try {
      let res;
      try {
        res = await APIClient.generateEvents(
          requestedYears,
          timezone,
          includeAll,
        );
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.generateEvents(
            requestedYears,
            timezone,
            includeAll,
          );
        } else {
          throw err;
        }
      }

      const minRequestedYear = Math.min(...requestedYears);
      const maxRequestedYear = Math.max(...requestedYears);
      const nextStart =
        generatedYearsRange.start == null
          ? minRequestedYear
          : Math.min(generatedYearsRange.start, minRequestedYear);
      const nextEnd =
        generatedYearsRange.end == null
          ? maxRequestedYear
          : Math.max(generatedYearsRange.end, maxRequestedYear);
      setGeneratedYearsRange({ start: nextStart, end: nextEnd });

      if (isAuth) {
        setUser((prev) => {
          const base = prev?.toJSON ? prev.toJSON() : prev;
          const updated = createUser(base);
          updated.updateProfile({
            generatedYearsStart: nextStart,
            generatedYearsEnd: nextEnd,
          });
          return updated;
        });
      }

      const evRange = eventsQueryRange({
        generatedYearsStart: nextStart,
        generatedYearsEnd: nextEnd,
      });
      let reloadRes;
      try {
        reloadRes = isAuth
          ? await APIClient.getEvents(evRange)
          : await OfflineClient.getEvents(evRange);
      } catch (reloadErr) {
        if (shouldFallbackToOffline(reloadErr) && isAuth) {
          reloadRes = await OfflineClient.getEvents(evRange);
        }
      }
      const loaded = reloadRes?.events ?? [];
      saveEvents(loaded);
    } catch {
      // Keep generatedYearsRange unchanged on failure.
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
      const evRange = eventsQueryRange();
      try {
        const reload = isAuth
          ? await APIClient.getEvents(evRange)
          : await OfflineClient.getEvents(evRange);
        saveEvents(reload?.events ?? [created, ...eventsRef.current]);
      } catch {
        saveEvents([created, ...eventsRef.current]);
      }
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
      const evRange = eventsQueryRange();
      let reloadRes;
      try {
        reloadRes = isAuth
          ? await APIClient.getEvents(evRange)
          : await OfflineClient.getEvents(evRange);
      } catch (err) {
        if (shouldFallbackToOffline(err) && isAuth) {
          reloadRes = await OfflineClient.getEvents(evRange);
        } else {
          throw err;
        }
      }
      const list = reloadRes?.events ?? [];
      saveEvents(list);
      return list.find((e) => e.eventId === eventId) ?? null;
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
      const evRange = eventsQueryRange();
      try {
        const reload = isAuth
          ? await APIClient.getEvents(evRange)
          : await OfflineClient.getEvents(evRange);
        saveEvents(reload?.events ?? eventsRef.current);
      } catch {
        const next = eventsRef.current.map((e) =>
          e.eventId === eventId ? { ...e, ...updated } : e,
        );
        saveEvents(next);
      }
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
   * Fetch expanded events for an explicit date range without replacing context state.
   * Used for .ics export. Same API/offline rules as refreshFromBackend.
   *
   * @param {{ from: string, to: string }} range — YYYY-MM-DD inclusive
   * @returns {Promise<Object[]>}
   */
  async function fetchExpandedEventsForRange({ from, to }) {
    const query = { from, to };
    let res;
    if (isAuth) {
      try {
        res = await APIClient.getEvents(query);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.getEvents(query);
        } else {
          throw err;
        }
      }
    } else {
      res = await OfflineClient.getEvents(query);
    }
    return res?.events ?? [];
  }

  /**
   * Reload events from the data source (manual refresh).
   * Tries API first; falls back to IndexedDB.
   */
  async function refreshFromBackend() {
    setIsRefreshing(true);
    setError(null);
    try {
      const evRange = eventsQueryRange();
      let res;
      try {
        res = await APIClient.getEvents(evRange);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.getEvents(evRange);
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
   * Reset calendar — either Islamic masters for enabled definitions only, or full wipe.
   *
   * @param {{ mode?: 'islamicEnabled' | 'all' }} [options]
   * @returns {Promise<{ ok: boolean, reason?: string, error?: string }>}
   */
  async function resetCalendar(options = {}) {
    const mode = options.mode ?? "islamicEnabled";

    if (mode === "all") {
      try {
        await APIClient.deleteAllEvents();
      } catch {
        await OfflineClient.clearAll();
      }

      saveEvents([]);
      setGeneratedYearsRange({ start: null, end: null });
      if (isAuth) {
        setUser((prev) => {
          const base = prev?.toJSON ? prev.toJSON() : prev;
          const updated = createUser(base);
          updated.updateProfile({
            generatedYearsStart: null,
            generatedYearsEnd: null,
          });
          return updated;
        });
      }

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
      return { ok: true };
    }

    const definitionIds = islamicEventDefs
      .filter((d) => !d.isHidden)
      .map((d) => d.id);
    if (definitionIds.length === 0) {
      return { ok: false, reason: "no-enabled-definitions" };
    }

    let res;
    try {
      try {
        res = await APIClient.resetIslamicEventsForDefinitions(definitionIds);
      } catch (err) {
        if (shouldFallbackToOffline(err)) {
          res = await OfflineClient.resetIslamicEventsForDefinitions(
            definitionIds,
          );
        } else {
          throw err;
        }
      }
    } catch (err) {
      const msg = err.message ?? "Failed to reset Islamic events";
      setError(msg);
      return { ok: false, error: msg };
    }

    const nextStart = res?.generatedYearsStart ?? null;
    const nextEnd = res?.generatedYearsEnd ?? null;
    setGeneratedYearsRange({ start: nextStart, end: nextEnd });
    if (isAuth) {
      setUser((prev) => {
        const base = prev?.toJSON ? prev.toJSON() : prev;
        const updated = createUser(base);
        updated.updateProfile({
          generatedYearsStart: nextStart,
          generatedYearsEnd: nextEnd,
        });
        return updated;
      });
    }

    const evRange = eventsQueryRange({
      generatedYearsStart: nextStart,
      generatedYearsEnd: nextEnd,
    });
    try {
      let reloadRes;
      try {
        reloadRes = isAuth
          ? await APIClient.getEvents(evRange)
          : await OfflineClient.getEvents(evRange);
      } catch (reloadErr) {
        if (shouldFallbackToOffline(reloadErr) && isAuth) {
          reloadRes = await OfflineClient.getEvents(evRange);
        } else {
          throw reloadErr;
        }
      }
      saveEvents(reloadRes?.events ?? []);
    } catch {
      const idSet = new Set(definitionIds);
      const next = eventsRef.current.filter(
        (e) =>
          e.islamicDefinitionId == null ||
          !idSet.has(e.islamicDefinitionId),
      );
      saveEvents(next);
    }

    return { ok: true };
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
        generatedYearsRange,
        fetchExpandedEventsForRange,

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
