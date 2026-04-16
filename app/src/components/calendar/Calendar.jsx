import { Alert, Box, Collapse, LinearProgress } from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import { useUser } from "../../contexts/UserContext";
import CalendarActionBar from "./CalendarActionBar";
import CalendarToolbar from "./CalendarToolbar";
import EventModal from "./EventModal";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import {
  toDateKey,
  startOfWeek,
  useToolbarLabel,
  dateKeyToLocalDate,
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

  // ── Navigation ──────────────────────────────────────────────────────────────

  function goToday() {
    setCursor(new Date(today));
  }

  function goPrev() {
    setCursor((prev) => {
      const d = new Date(prev);
      if (currentView === "month") d.setMonth(d.getMonth() - 1);
      else if (currentView === "week") d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  }

  function goNext() {
    setCursor((prev) => {
      const d = new Date(prev);
      if (currentView === "month") d.setMonth(d.getMonth() + 1);
      else if (currentView === "week") d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      return d;
    });
  }

  useEffect(() => {
    if (!pendingCalendarDateJump) return;
    const targetDate = dateKeyToLocalDate(pendingCalendarDateJump);
    if (targetDate) {
      setCursor(targetDate);
    }
    consumeCalendarDateJump();
  }, [pendingCalendarDateJump, consumeCalendarDateJump]);

  // ── Toolbar label ───────────────────────────────────────────────────────────
  const toolbarLabel = useToolbarLabel(cursor, currentView);

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
        currentView={currentView}
        changeView={changeView}
        goToday={goToday}
        goPrev={goPrev}
        goNext={goNext}
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
