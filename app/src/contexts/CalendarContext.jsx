import { createContext, useContext, useEffect, useState } from "react";
import APIClient from "../util/ApiClient";

const CalendarContext = createContext(null);

const VIEW_STORAGE_KEY = "calendarView";
const VALID_VIEWS = ["month", "week", "day"];

function getSavedView() {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY);
  return VALID_VIEWS.includes(saved) ? saved : "month";
}

export function CalendarProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [providers, setProviders] = useState([]);
  const [currentView, setCurrentView] = useState(getSavedView);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([APIClient.getEvents(), APIClient.getProviders()])
      .then(([eventsData, providersData]) => {
        if (cancelled) return;
        setEvents(eventsData?.events ?? []);
        setProviders(providersData?.providers ?? []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message ?? "Failed to load calendar data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function changeView(view) {
    if (!VALID_VIEWS.includes(view)) return;
    setCurrentView(view);
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }

  async function addEvent(eventData) {
    const res = await APIClient.createEvent(eventData);
    const created = res?.event ?? res;
    setEvents((prev) => [created, ...prev]);
    return created;
  }

  async function updateEvent(eventId, updates) {
    const res = await APIClient.updateEvent(eventId, updates);
    const updated = res?.event ?? res;
    setEvents((prev) =>
      prev.map((e) => (e.eventId === eventId ? updated : e))
    );
    return updated;
  }

  async function removeEvent(eventId) {
    await APIClient.deleteEvent(eventId);
    setEvents((prev) => prev.filter((e) => e.eventId !== eventId));
  }

  return (
    <CalendarContext.Provider
      value={{
        events,
        providers,
        currentView,
        changeView,
        loading,
        error,
        addEvent,
        updateEvent,
        removeEvent,
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
