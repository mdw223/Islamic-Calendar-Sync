import {
  CalendarDays as TodayIcon,
  ChevronLeft,
  ChevronRight,
  Plus as AddIcon,
} from "lucide-react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useCalendar } from "../../contexts/CalendarContext";
import EventModal from "./EventModal";

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function eventColor(event, theme) {
  const palette = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
  ];
  return palette[(event.eventTypeId ?? 1) % palette.length];
}

// ── Event chip used in month / week / day cells ──────────────────────────────

function EventChip({ event, onClick, theme }) {
  return (
    <Chip
      key={event.eventId}
      label={event.name}
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      sx={{
        width: "100%",
        justifyContent: "flex-start",
        bgcolor: eventColor(event, theme),
        color: "#fff",
        fontSize: "0.7rem",
        height: 20,
        cursor: "pointer",
        "& .MuiChip-label": {
          px: 0.75,
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
      }}
    />
  );
}

// ── Month view ────────────────────────────────────────────────────────────────

function MonthView({ year, month, events, onDayClick, onEventClick }) {
  const theme = useTheme();
  const today = new Date();

  const { days, startOffset } = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { days: daysInMonth, startOffset: firstDay };
  }, [year, month]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = (ev.startDate ?? "").slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const result = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= days; d++) result.push(d);
    return result;
  }, [startOffset, days]);

  return (
    <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
      {/* Day-of-week header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          mb: 0.5,
        }}
      >
        {DAY_NAMES.map((d) => (
          <Typography
            key={d}
            variant="caption"
            align="center"
            fontWeight={600}
            color="text.secondary"
            sx={{ py: 0.5 }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
        }}
      >
        {cells.map((day, idx) => {
          if (!day) return <Box key={`empty-${idx}`} />;

          const cellDate = new Date(year, month, day);
          const key = toDateKey(cellDate);
          const isToday = sameDay(cellDate, today);
          const dayEvents = eventsByDay[key] ?? [];

          return (
            <Paper
              key={key}
              variant="outlined"
              onClick={() => onDayClick(key)}
              sx={{
                minHeight: 90,
                p: 0.75,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 0.25,
                borderColor: isToday ? "primary.main" : "divider",
                borderWidth: isToday ? 2 : 1,
                transition: "background-color 0.15s",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "flex-end",
                  bgcolor: isToday ? "primary.main" : "transparent",
                  color: isToday ? "primary.contrastText" : "text.primary",
                  fontWeight: isToday ? 700 : 400,
                  fontSize: "0.8rem",
                }}
              >
                {day}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.25,
                  flex: 1,
                }}
              >
                {dayEvents.slice(0, 3).map((ev) => (
                  <EventChip
                    key={ev.eventId}
                    event={ev}
                    onClick={onEventClick}
                    theme={theme}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ pl: 0.5 }}
                  >
                    +{dayEvents.length - 3} more
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────

function WeekView({ weekStart, events, onSlotClick, onEventClick }) {
  const theme = useTheme();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = (ev.startDate ?? "").slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Day header row */}
      <Box sx={{ display: "flex", borderBottom: 1, borderColor: "divider" }}>
        <Box sx={{ width: 56, flexShrink: 0 }} />
        {days.map((d) => {
          const isToday = sameDay(d, today);
          return (
            <Box
              key={toDateKey(d)}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1,
                borderLeft: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                fontWeight={600}
              >
                {DAY_NAMES[d.getDay()]}
              </Typography>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: isToday ? "primary.main" : "transparent",
                  color: isToday ? "primary.contrastText" : "text.primary",
                  fontWeight: isToday ? 700 : 500,
                  fontSize: "0.95rem",
                }}
              >
                {d.getDate()}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Time grid */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {HOURS.map((hour) => (
          <Box
            key={hour}
            sx={{
              display: "flex",
              minHeight: 56,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                width: 56,
                flexShrink: 0,
                pr: 1,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                pt: 0.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {hour === 0
                  ? ""
                  : `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`}
              </Typography>
            </Box>

            {days.map((d) => {
              const key = toDateKey(d);
              const slotEvents = (eventsByDay[key] ?? []).filter((ev) => {
                const h = ev.startDate ? new Date(ev.startDate).getHours() : -1;
                return h === hour;
              });

              return (
                <Box
                  key={key}
                  onClick={() =>
                    onSlotClick(`${key}T${String(hour).padStart(2, "0")}:00`)
                  }
                  sx={{
                    flex: 1,
                    borderLeft: 1,
                    borderColor: "divider",
                    cursor: "pointer",
                    position: "relative",
                    px: 0.25,
                    pt: 0.25,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  {slotEvents.map((ev) => (
                    <EventChip
                      key={ev.eventId}
                      event={ev}
                      onClick={onEventClick}
                      theme={theme}
                    />
                  ))}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── Day view ──────────────────────────────────────────────────────────────────

function DayView({ date, events, onSlotClick, onEventClick }) {
  const theme = useTheme();
  const key = toDateKey(date);

  const dayEvents = useMemo(
    () => events.filter((ev) => (ev.startDate ?? "").slice(0, 10) === key),
    [events, key],
  );

  return (
    <Box sx={{ flex: 1, overflow: "auto" }}>
      {HOURS.map((hour) => {
        const slotEvents = dayEvents.filter((ev) => {
          const h = ev.startDate ? new Date(ev.startDate).getHours() : -1;
          return h === hour;
        });

        return (
          <Box
            key={hour}
            onClick={() =>
              onSlotClick(`${key}T${String(hour).padStart(2, "0")}:00`)
            }
            sx={{
              display: "flex",
              minHeight: 64,
              borderBottom: 1,
              borderColor: "divider",
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box
              sx={{
                width: 72,
                flexShrink: 0,
                pr: 2,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "flex-start",
                pt: 0.75,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {hour === 0
                  ? ""
                  : `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                borderLeft: 1,
                borderColor: "divider",
                px: 1,
                pt: 0.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              {slotEvents.map((ev) => (
                <EventChip
                  key={ev.eventId}
                  event={ev}
                  onClick={onEventClick}
                  theme={theme}
                />
              ))}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ── Main Calendar component ───────────────────────────────────────────────────

export default function Calendar() {
  const { events, currentView, changeView, loading, error } = useCalendar();
  const today = new Date();

  const [cursor, setCursor] = useState(() => new Date(today));

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

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

  const toolbarLabel = useMemo(() => {
    if (currentView === "month") {
      return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    }
    if (currentView === "week") {
      const ws = startOfWeek(cursor);
      const we = addDays(ws, 6);
      if (ws.getMonth() === we.getMonth()) {
        return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${we.getDate()}, ${ws.getFullYear()}`;
      }
      return `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${MONTH_NAMES[we.getMonth()]} ${we.getDate()}, ${ws.getFullYear()}`;
    }
    return `${DAY_NAMES[cursor.getDay()]}, ${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
  }, [cursor, currentView]);

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

  // ── Render ──────────────────────────────────────────────────────────────────

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
      </Paper>

      {/* Non-blocking loading indicator */}
      {loading && <LinearProgress />}

      {/* Calendar always rendered — events is [] while loading */}
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
