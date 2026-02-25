import { Chip } from "@mui/material";
import { useMemo } from "react";
import { DAY_NAMES, MONTH_NAMES } from "../../constants";
import { getHijriMonthRangeLabel, getHijriParts } from "../../util/hijriUtils";

/**
 * Returns a YYYY-MM-DD string for a given Date, used as a stable map key
 * when grouping events by day.
 */
export function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the Sunday that starts the week containing `date`, with the time
 * component reset to midnight so date comparisons are consistent.
 */
export function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns a new Date that is `n` days after `date`.
 */
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * Returns true when two Date objects represent the same calendar day,
 * regardless of their time components.
 */
export function sameDay(a, b) {
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
export function eventColor(event, theme) {
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
 * A compact, coloured chip that represents a single event inside a calendar
 * cell. Clicking it opens the edit modal without also triggering the day-click
 * handler on the parent cell.
 */
export function EventChip({ event, onClick, theme }) {
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

/**
 * Builds the primary toolbar heading shown next to the navigation arrows.
 * Always includes the Hijri month(s) that overlap with the visible range.
 *
 * - Month view: "MMMM YYYY  ·  <Hijri range>"
 * - Week view:  "MMMM D – D, YYYY  ·  <Hijri range>" (or cross-month variant)
 * - Day view:   "DDD, MMMM D, YYYY  ·  <Hijri day> <Hijri month> <Hijri year> AH"
 */
export function useToolbarLabel(cursor, currentView) {
  return useMemo(() => {
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

      const firstHijri = getHijriParts(ws);
      const lastHijri = getHijriParts(we);
      const hijri =
        firstHijri.month === lastHijri.month
          ? `${firstHijri.month} ${firstHijri.year} AH`
          : `${firstHijri.month} – ${lastHijri.month} ${lastHijri.year} AH`;

      return `${gregorian}  ·  ${hijri}`;
    }

    const hijri = getHijriParts(cursor);
    const gregorian = `${DAY_NAMES[cursor.getDay()]}, ${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
    return `${gregorian}  ·  ${hijri.day} ${hijri.month} ${hijri.year} AH`;
  }, [cursor, currentView]);
}
