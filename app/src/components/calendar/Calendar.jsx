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

// Reused across every Hijri conversion call — instantiated once to avoid
// repeated construction overhead inside render loops.
const HIJRI_FORMATTER = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a YYYY-MM-DD string for a given Date, used as a stable map key
 * when grouping events by day.
 */
function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the Sunday that starts the week containing `date`, with the time
 * component reset to midnight so date comparisons are consistent.
 */
function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a new Date that is `n` days after `date`.
 * A positive `n` moves forward; a negative `n` moves backward.
 */
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Returns true when two Date objects represent the same calendar day,
 * regardless of their time components.
 */
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Maps an event's `eventTypeId` to a colour from the theme palette so that
 * different Islamic event types are visually distinct on the calendar.
 */
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

/**
 * Converts a Gregorian Date to its Hijri equivalent using the Umm al-Qura
 * calendar via the browser's built-in Intl API. Returns an object with
 * string fields `day`, `month` (English name), and `year`.
 *
 * Example: new Date(2026, 1, 1) → { day: "3", month: "Sha'ban", year: "1447" }
 */
function getHijriParts(date) {
  const parts = HIJRI_FORMATTER.formatToParts(date);
  return {
    day: parts.find((p) => p.type === "day")?.value ?? "",
    month: parts.find((p) => p.type === "month")?.value ?? "",
    year: parts.find((p) => p.type === "year")?.value ?? "",
  };
}

/**
 * Returns a human-readable label describing which Hijri month(s) overlap with
 * a given Gregorian month, e.g. "Sha'ban – Ramadan 1447 AH".
 *
 * A Gregorian month always spans one or two Hijri months. In the rare case
 * that the Hijri year rolls over within the month (Dhul Hijja → Muharram),
 * both years are shown: "Dhul Hijja 1447 – Muharram 1448 AH".
 */
function getHijriMonthRangeLabel(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const first = getHijriParts(new Date(year, month, 1));
  const last = getHijriParts(new Date(year, month, daysInMonth));

  if (first.month === last.month) {
    return `${first.month} ${first.year} AH`;
  }
  if (first.year !== last.year) {
    return `${first.month} ${first.year} – ${last.month} ${last.year} AH`;
  }
  return `${first.month} – ${last.month} ${last.year} AH`;
}

// ── Event chip used in month / week / day cells ──────────────────────────────

/**
 * A compact, coloured chip that represents a single event inside a calendar
 * cell. Clicking it opens the edit modal without also triggering the day-click
 * handler on the parent cell.
 */
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

/**
 * Renders a standard monthly grid (Sun–Sat columns) for the given `year` and
 * `month` (0-indexed). Each cell shows:
 *  - The Hijri day number (top-left, small)
 *  - The Gregorian day number (top-right, highlighted circle when today)
 *  - Up to 3 event chips; a "+N more" label when there are additional events
 *
 * Clicking an empty cell calls `onDayClick(dateKey)` to open the create modal
 * pre-filled with that date. Clicking an event chip calls `onEventClick(event)`
 * to open the edit modal.
 */
function MonthView({ year, month, events, onDayClick, onEventClick }) {
  const theme = useTheme();
  const today = new Date();

  // Compute the grid layout dimensions and a Hijri day lookup for every date
  // in the month. All derived from year+month so they update on navigation.
  const { days, startOffset, hijriByDay } = useMemo(() => {
    // Which weekday (0=Sun) the 1st falls on determines the leading empty cells.
    const firstDay = new Date(year, month, 1).getDay();
    // Passing day=0 of the next month gives the last day of the current month.
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build a map of { gregorianDay → hijriParts } for every day in the month
    // so we can look up the Hijri date in O(1) during rendering.
    const hijriByDay = {};
    for (let d = 1; d <= daysInMonth; d++) {
      hijriByDay[d] = getHijriParts(new Date(year, month, d));
    }

    return { days: daysInMonth, startOffset: firstDay, hijriByDay };
  }, [year, month]);

  // Index events by their start-date string so each cell can look up its
  // events in O(1) rather than scanning the full list.
  const eventsByDay = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = (ev.startDate ?? "").slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  // Build the flat cell array: nulls for the leading blank days, then 1–N for
  // the actual dates. The grid CSS handles wrapping into rows automatically.
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
          const hijri = hijriByDay[day];

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
              {/* Date number row: Hijri day on the left, Gregorian on the right */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {/* Hijri day number — small secondary text */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem", lineHeight: 1, pl: 0.25 }}
                >
                  {hijri?.day}
                </Typography>

                {/* Gregorian day number — highlighted circle when today */}
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isToday ? "primary.main" : "transparent",
                    color: isToday ? "primary.contrastText" : "text.primary",
                    fontWeight: isToday ? 700 : 400,
                    fontSize: "0.8rem",
                  }}
                >
                  {day}
                </Box>
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

/**
 * Renders a 7-column time grid for the week beginning at `weekStart`. Each
 * column header shows the weekday name, the Gregorian date number (highlighted
 * when today), and the Hijri date below it. The body is a 24-row hourly grid;
 * clicking any slot calls `onSlotClick` with a datetime string pre-filled to
 * that hour so the create modal can set the event's start time automatically.
 */
function WeekView({ weekStart, events, onSlotClick, onEventClick }) {
  const theme = useTheme();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Index events by date key for O(1) per-cell lookup during rendering.
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
          const hijri = getHijriParts(d);
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
              {/* Weekday abbreviation */}
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                fontWeight={600}
              >
                {DAY_NAMES[d.getDay()]}
              </Typography>

              {/* Gregorian day number — highlighted circle when today */}
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

              {/* Hijri day and month name below the Gregorian number */}
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ fontSize: "0.6rem", mt: 0.25 }}
              >
                {hijri.day} {hijri.month}
              </Typography>
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

/**
 * Renders a 24-row hourly grid for a single `date`. Each row shows a time
 * label on the left and any events scheduled at that hour on the right.
 * Clicking a row calls `onSlotClick` with the ISO datetime string for that
 * hour so the create modal opens pre-filled with the correct start time.
 */
function DayView({ date, events, onSlotClick, onEventClick }) {
  const theme = useTheme();
  const key = toDateKey(date);

  // Filter the full event list down to just the events for this day.
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

/**
 * Top-level calendar component. Manages the cursor (which date the user is
 * currently viewing), the active view (month/week/day), and the event modal
 * state. Delegates rendering of the actual grid to MonthView, WeekView, or
 * DayView based on `currentView` from CalendarContext.
 */
export default function Calendar() {
  const { events, currentView, changeView, loading, error } = useCalendar();
  const today = new Date();

  // `cursor` tracks the date the user has navigated to; navigation buttons
  // advance or rewind it by a month, week, or day depending on the active view.
  const [cursor, setCursor] = useState(() => new Date(today));

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  // ── Navigation ──────────────────────────────────────────────────────────────

  /** Snaps the cursor back to today's date. */
  function goToday() {
    setCursor(new Date(today));
  }

  /**
   * Moves the cursor backward by one unit of the current view:
   * one month for month view, one week for week view, one day for day view.
   */
  function goPrev() {
    setCursor((prev) => {
      const d = new Date(prev);
      if (currentView === "month") d.setMonth(d.getMonth() - 1);
      else if (currentView === "week") d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  }

  /**
   * Moves the cursor forward by one unit of the current view:
   * one month for month view, one week for week view, one day for day view.
   */
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

  /**
   * Builds the primary toolbar heading shown next to the navigation arrows.
   * Always includes the Hijri month(s) that overlap with the visible range,
   * e.g. "February 2026  ·  Sha'ban – Ramadan 1447 AH".
   *
   * - Month view: "MMMM YYYY  ·  <Hijri range>"
   * - Week view:  "MMMM D – D, YYYY  ·  <Hijri range>" (or cross-month variant)
   * - Day view:   "DDD, MMMM D, YYYY  ·  <Hijri day> <Hijri month> <Hijri year> AH"
   */
  const toolbarLabel = useMemo(() => {
    if (currentView === "month") {
      const gregorian = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
      const hijri = getHijriMonthRangeLabel(
        cursor.getFullYear(),
        cursor.getMonth(),
      );
      return `${gregorian}  ·  ${hijri}`;
    }

    if (currentView === "week") {
      const ws = startOfWeek(cursor);
      const we = addDays(ws, 6);
      const gregorian =
        ws.getMonth() === we.getMonth()
          ? `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${we.getDate()}, ${ws.getFullYear()}`
          : `${MONTH_NAMES[ws.getMonth()]} ${ws.getDate()} – ${MONTH_NAMES[we.getMonth()]} ${we.getDate()}, ${ws.getFullYear()}`;

      // Build the Hijri range label from the first and last day of the week.
      const firstHijri = getHijriParts(ws);
      const lastHijri = getHijriParts(we);
      const hijri =
        firstHijri.month === lastHijri.month
          ? `${firstHijri.month} ${firstHijri.year} AH`
          : `${firstHijri.month} – ${lastHijri.month} ${lastHijri.year} AH`;

      return `${gregorian}  ·  ${hijri}`;
    }

    // Day view: show the full Hijri date for the single visible day.
    const hijri = getHijriParts(cursor);
    const gregorian = `${DAY_NAMES[cursor.getDay()]}, ${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
    return `${gregorian}  ·  ${hijri.day} ${hijri.month} ${hijri.year} AH`;
  }, [cursor, currentView]);

  // ── Modal helpers ───────────────────────────────────────────────────────────

  /**
   * Opens the event creation modal. If `dateString` is provided (from clicking
   * a specific day or time slot) the modal is pre-filled with that date/time;
   * otherwise it defaults to today.
   */
  function openCreate(dateString) {
    const date = dateString ? dateString.slice(0, 10) : toDateKey(today);
    setEditingEvent(null);
    setModalInitialDate(date);
    setModalOpen(true);
  }

  /**
   * Opens the event edit modal pre-populated with the data from `event`.
   * Clears `modalInitialDate` since the date is taken from the event itself.
   */
  function openEdit(event) {
    setEditingEvent(event);
    setModalInitialDate(null);
    setModalOpen(true);
  }

  /** Closes the modal and resets all modal-related state. */
  function closeModal() {
    setModalOpen(false);
    setEditingEvent(null);
    setModalInitialDate(null);
  }

  // ── Visible events (exclude hidden) ────────────────────────────────────────

  // Events with `hide: true` are stored but not rendered on the calendar grid
  // (e.g. events the user has chosen to suppress from view).
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
