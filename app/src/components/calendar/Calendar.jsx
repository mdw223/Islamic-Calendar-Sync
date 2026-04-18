import { Alert, Box, Collapse, LinearProgress } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useCalendar } from "../../contexts/CalendarContext";
import { useUser } from "../../contexts/UserContext";
import CalendarActionBar from "./CalendarActionBar";
import CalendarToolbar from "./CalendarToolbar";
import EventModal from "./EventModal";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import {
  buildCalendarPath,
  buildCalendarMonthOptions,
  toDateKey,
  startOfWeek,
  useToolbarLabel,
  dateKeyToLocalDate,
  parseCalendarRouteState,
  normalizeCalendarView,
} from "./CalendarHelpers.jsx";

/**
 * Top-level calendar component. Manages the cursor (which date the user is
 * currently viewing), the active view (month/week/day), and the event modal
 * state. Delegates rendering of the actual grid to MonthView, WeekView, or
 * DayView based on `currentView` from CalendarContext.
 */
export default function Calendar() {
  const {
    events,
    currentView,
    changeView,
    loading,
    error,
    refreshFromBackend,
    isRefreshing,
    ensureIslamicEventsForYears,
    pendingCalendarDateJump,
    consumeCalendarDateJump,
  } = useCalendar();

  const { user } = useUser();
  const { view: viewParam, year: yearParam, month: monthParam, day: dayParam } =
    useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date();

  const [cursor, setCursor] = useState(() => new Date(today));

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // ── Refresh feedback state ────────────────────────────────────────────────
  const [refreshFeedback, setRefreshFeedback] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);
  const refreshTimer = useRef(null);

  const routeState = useMemo(
    () =>
      parseCalendarRouteState({
        view: viewParam,
        year: yearParam,
        month: monthParam,
        day: dayParam,
        fallbackView: "month",
      }),
    [viewParam, yearParam, monthParam, dayParam, currentView],
  );
  const suppressUrlSyncRef = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(refreshTimer.current);
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    setFeedbackError(null);
    const result = await refreshFromBackend();
    if (result?.ok) {
      setRefreshFeedback("success");
    } else {
      setRefreshFeedback("error");
      setFeedbackError(result?.error ?? "Failed to refresh events");
    }
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => setRefreshFeedback(null), 2500);
  }, [refreshFromBackend]);

  const hydratedPathRef = useRef(null);

  useEffect(() => {
    if (hydratedPathRef.current === location.pathname) return;
    hydratedPathRef.current = location.pathname;

    suppressUrlSyncRef.current = location.pathname;

    if (!routeState) return;

    setCursor((prev) => {
      const nextCursor = routeState.cursor;
      if (
        prev.getFullYear() === nextCursor.getFullYear() &&
        prev.getMonth() === nextCursor.getMonth() &&
        prev.getDate() === nextCursor.getDate() &&
        prev.getHours() === nextCursor.getHours()
      ) {
        return prev;
      }
      return nextCursor;
    });

    if (routeState.view !== currentView) {
      changeView(routeState.view);
    }
  }, [location.pathname, routeState, currentView, changeView]);

  useEffect(() => {
    if (!routeState) return;
    if (suppressUrlSyncRef.current !== location.pathname) return;

    const nextCursor = routeState.cursor;
    const cursorMatches =
      cursor.getFullYear() === nextCursor.getFullYear() &&
      cursor.getMonth() === nextCursor.getMonth() &&
      cursor.getDate() === nextCursor.getDate() &&
      cursor.getHours() === nextCursor.getHours();

    if (currentView === routeState.view && cursorMatches) {
      suppressUrlSyncRef.current = null;
    }
  }, [routeState, location.pathname, currentView, cursor]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goToday() {
    setCursor(
      currentView === "month"
        ? new Date(today.getFullYear(), today.getMonth(), 1)
        : new Date(today),
    );
  }

  function goPrev() {
    setCursor((prev) => {
      const d = new Date(prev);
      if (currentView === "month") d.setMonth(d.getMonth() - 1);
      else if (currentView === "week") d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      if (currentView === "month") d.setDate(1);
      return d;
    });
  }

  function goNext() {
    setCursor((prev) => {
      const d = new Date(prev);
      if (currentView === "month") d.setMonth(d.getMonth() + 1);
      else if (currentView === "week") d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      if (currentView === "month") d.setDate(1);
      return d;
    });
  }

  useEffect(() => {
    if (!pendingCalendarDateJump) return;
    const targetDate = dateKeyToLocalDate(pendingCalendarDateJump);
    if (targetDate) {
      setCursor(
        currentView === "month"
          ? new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
          : targetDate,
      );
    }
    consumeCalendarDateJump();
  }, [pendingCalendarDateJump, consumeCalendarDateJump, currentView]);

  useEffect(() => {
    if (suppressUrlSyncRef.current === location.pathname) {
      return;
    }

    const canonicalPath = buildCalendarPath(currentView, cursor);
    if (location.pathname === canonicalPath) {
      return;
    }

    navigate(canonicalPath, { replace: true });
  }, [
    cursor,
    currentView,
    location.pathname,
    navigate,
  ]);

  function handleChangeView(nextView) {
    const normalizedView = normalizeCalendarView(nextView, currentView);
    const nextCursor =
      normalizedView === "month"
        ? new Date(cursor.getFullYear(), cursor.getMonth(), 1)
        : new Date(cursor);
    if (normalizedView === "month") {
      nextCursor.setDate(1);
    }
    setCursor(nextCursor);
    changeView(normalizedView);
  }

  function handleGoToday() {
    goToday();
  }

  function handleGoPrev() {
    goPrev();
  }

  function handleGoNext() {
    goNext();
  }

  // ── Toolbar label ───────────────────────────────────────────────────────────
  const toolbarLabel = useToolbarLabel(cursor, currentView);
  const monthOptions = useMemo(
    () => buildCalendarMonthOptions(cursor.getFullYear()),
    [cursor.getFullYear()],
  );

  function handleMonthSelect(monthIndex) {
    if (!Number.isInteger(monthIndex)) return;

    setCursor(new Date(cursor.getFullYear(), monthIndex, 1, 12, 0, 0, 0));
    if (currentView !== "month") {
      changeView("month");
    }
  }

  // ── Modal helpers ───────────────────────────────────────────────────────────

  function openCreate(dateString) {
    const date = dateString ?? toDateKey(today);
    setEditingEvent(null);
    setModalInitialDate(date);
    setModalOpen(true);
  }

  function openEdit(event) {
    setEditingEvent(event);
    setModalInitialDate(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingEvent(null);
    setModalInitialDate(null);
  }

  // ── Visible events (exclude hidden) ────────────────────────────────────────

  const visibleEvents = useMemo(
    () => events.filter((ev) => !ev.hide),
    [events],
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <CalendarToolbar
        toolbarLabel={toolbarLabel}
        monthOptions={monthOptions}
        currentMonthIndex={cursor.getMonth()}
        onMonthSelect={handleMonthSelect}
        currentView={currentView}
        changeView={handleChangeView}
        goToday={handleGoToday}
        goPrev={handleGoPrev}
        goNext={handleGoNext}
      />

      {/* Refresh error banner */}
      <Collapse in={feedbackError != null}>
        <Alert
          severity="error"
          onClose={() => setFeedbackError(null)}
          sx={{ borderRadius: 0 }}
        >
          {feedbackError}
        </Alert>
      </Collapse>

      {/* Non-blocking loading indicator */}
      {loading && <LinearProgress />}

      {/* Calendar views */}
      {currentView === "month" && (
        <MonthView
          year={cursor.getFullYear()}
          month={cursor.getMonth()}
          events={visibleEvents}
          onDayClick={openCreate}
          onEventClick={openEdit}
        />
      )}

      {currentView === "week" && (
        <WeekView
          weekStart={startOfWeek(cursor)}
          events={visibleEvents}
          onSlotClick={openCreate}
          onEventClick={openEdit}
        />
      )}

      {currentView === "day" && (
        <DayView
          date={cursor}
          events={visibleEvents}
          onSlotClick={openCreate}
          onEventClick={openEdit}
        />
      )}

      {/* Action buttons (Add Event, Sync, Refresh) */}
      <CalendarActionBar
        onAddEvent={() => openCreate(null)}
        user={user}
        isRefreshing={isRefreshing}
        refreshFeedback={refreshFeedback}
        onRefresh={handleRefresh}
      />

      {/* Event modal */}
      <EventModal
        open={modalOpen}
        onClose={closeModal}
        initialDate={modalInitialDate}
        event={editingEvent}
      />
    </Box>
  );
}
