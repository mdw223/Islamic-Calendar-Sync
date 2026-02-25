import {
  CalendarDays as TodayIcon,
  Check as CheckIcon,
  ChevronLeft,
  ChevronRight,
  Plus as AddIcon,
  RefreshCw as RefreshIcon,
  Upload as SyncIcon,
  X as XIcon,
} from "lucide-react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import { useUser } from "../../contexts/UserContext";
import EventModal from "./EventModal";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import LoginPromptModal from "../LoginPromptModal";
import { toDateKey, startOfWeek, useToolbarLabel } from "./CalendarHelpers.jsx";

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
    syncToBackend,
    refreshFromBackend,
    isSyncing,
    isRefreshing,
    ensureIslamicEventsForYear,
  } = useCalendar();

  const { user } = useUser();
  const today = new Date();

  const [cursor, setCursor] = useState(() => new Date(today));

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  // ── Sync / Refresh feedback state ─────────────────────────────────────────
  const [syncFeedback, setSyncFeedback] = useState(null); // 'success' | 'error' | null
  const [refreshFeedback, setRefreshFeedback] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null); // error message string
  const syncTimer = useRef(null);
  const refreshTimer = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(syncTimer.current);
      clearTimeout(refreshTimer.current);
    };
  }, []);

  const handleSync = useCallback(async () => {
    if (!user.isLoggedIn) {
      setLoginDialogOpen(true);
      return;
    }
    setFeedbackError(null);
    const result = await syncToBackend();
    if (result?.ok) {
      setSyncFeedback("success");
    } else {
      setSyncFeedback("error");
      setFeedbackError(result?.error ?? "Failed to sync events");
    }
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => setSyncFeedback(null), 2500);
  }, [user.isLoggedIn, syncToBackend]);

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

  // ── Year-change detection ─────────────────────────────────────────────────
  useEffect(() => {
    ensureIslamicEventsForYear(cursor.getFullYear());
  }, [cursor.getFullYear()]);

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

  // ── Toolbar label ───────────────────────────────────────────────────────────
  const toolbarLabel = useToolbarLabel(cursor, currentView);

  // ── Modal helpers ───────────────────────────────────────────────────────────

  function openCreate(dateString) {
    const date = dateString ? dateString.slice(0, 10) : toDateKey(today);
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
      {/* Toolbar */}
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Tooltip title="Go to today">
          <Button
            variant="outlined"
            size="small"
            startIcon={<TodayIcon />}
            onClick={goToday}
            sx={{ mr: 0.5 }}
          >
            Today
          </Button>
        </Tooltip>

        <IconButton size="small" onClick={goPrev} aria-label="Previous">
          <ChevronLeft />
        </IconButton>
        <IconButton size="small" onClick={goNext} aria-label="Next">
          <ChevronRight />
        </IconButton>

        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ flex: 1, mx: 1 }}
        >
          {toolbarLabel}
        </Typography>

        <ToggleButtonGroup
          value={currentView}
          exclusive
          size="small"
          onChange={(_, val) => val && changeView(val)}
        >
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="day">Day</ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => openCreate(null)}
          sx={{ ml: 1 }}
        >
          Add Event
        </Button>

        <Tooltip
          title={
            user.isLoggedIn
              ? "Sync Islamic events to your account"
              : "Sign in to sync your calendar"
          }
        >
          <span>
            <Button
              variant="outlined"
              size="small"
              startIcon={
                isSyncing ? (
                  <CircularProgress size={14} />
                ) : syncFeedback === "success" ? (
                  <CheckIcon
                    size={14}
                    style={{
                      color: "#10b981",
                      animation: "popIn 0.3s ease-out",
                    }}
                  />
                ) : syncFeedback === "error" ? (
                  <XIcon
                    size={14}
                    style={{
                      color: "#ef4444",
                      animation: "popIn 0.3s ease-out",
                    }}
                  />
                ) : (
                  <SyncIcon size={14} />
                )
              }
              disabled={isSyncing || syncFeedback != null}
              onClick={handleSync}
              sx={{
                ml: 0.5,
                ...(syncFeedback === "success" && {
                  borderColor: "#10b981",
                  color: "#10b981",
                }),
                ...(syncFeedback === "error" && {
                  borderColor: "#ef4444",
                  color: "#ef4444",
                }),
                "@keyframes popIn": {
                  "0%": { transform: "scale(0)" },
                  "60%": { transform: "scale(1.3)" },
                  "100%": { transform: "scale(1)" },
                },
              }}
            >
              {syncFeedback === "success"
                ? "Synced!"
                : syncFeedback === "error"
                  ? "Failed"
                  : "Sync"}
            </Button>
          </span>
        </Tooltip>

        {user.isLoggedIn && (
          <Tooltip title="Refresh events from your account">
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  isRefreshing ? (
                    <CircularProgress size={14} />
                  ) : refreshFeedback === "success" ? (
                    <CheckIcon
                      size={14}
                      style={{
                        color: "#10b981",
                        animation: "popIn 0.3s ease-out",
                      }}
                    />
                  ) : refreshFeedback === "error" ? (
                    <XIcon
                      size={14}
                      style={{
                        color: "#ef4444",
                        animation: "popIn 0.3s ease-out",
                      }}
                    />
                  ) : (
                    <RefreshIcon size={14} />
                  )
                }
                disabled={isRefreshing || refreshFeedback != null}
                onClick={handleRefresh}
                sx={{
                  ml: 0.5,
                  ...(refreshFeedback === "success" && {
                    borderColor: "#10b981",
                    color: "#10b981",
                  }),
                  ...(refreshFeedback === "error" && {
                    borderColor: "#ef4444",
                    color: "#ef4444",
                  }),
                  "@keyframes popIn": {
                    "0%": { transform: "scale(0)" },
                    "60%": { transform: "scale(1.3)" },
                    "100%": { transform: "scale(1)" },
                  },
                }}
              >
                {refreshFeedback === "success"
                  ? "Done!"
                  : refreshFeedback === "error"
                    ? "Failed"
                    : "Refresh"}
              </Button>
            </span>
          </Tooltip>
        )}
      </Paper>

      <LoginPromptModal
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />

      {/* Sync / Refresh error banner */}
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
