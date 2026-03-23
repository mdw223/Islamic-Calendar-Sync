import { Chip, useMediaQuery } from "@mui/material";
import { useMemo } from "react";
import { DAY_NAMES, MONTH_NAMES } from "../../Constants";
import { getHijriMonthRangeLabel, getHijriParts } from "../../util/HijriUtils";

/**
 * Returns a YYYY-MM-DD string for a given Date, used as a stable map key
 * when grouping events by day.
 */
export function toDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function toLocalDateKeyFromIso(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
 * Returns true if the given event overlaps the provided day key (YYYY-MM-DD).
 * The overlap check is inclusive of both `startDate` and `endDate`.
 */
export function eventOverlapsDateKey(event, dateKey) {
  if (!event || !dateKey) return false;
  const { startKey, endKey } = getEventStartEndDateKeys(event);
  if (!startKey) return false;

  // ISO date keys are lexicographically sortable (YYYY-MM-DD).
  return startKey <= dateKey && dateKey <= endKey;
}

function addDaysUTC(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/**
 * Returns an array of YYYY-MM-DD keys for every day the event overlaps,
 * clamped to the provided range keys (inclusive).
 */
export function getEventDayKeysInRange(event, rangeStartKey, rangeEndKey) {
  if (!event || !rangeStartKey || !rangeEndKey) return [];
  const { startKey, endKey } = getEventStartEndDateKeys(event);
  if (!startKey) return [];

  const clampedStartKey = startKey < rangeStartKey ? rangeStartKey : startKey;
  const clampedEndKey = endKey > rangeEndKey ? rangeEndKey : endKey;
  if (clampedEndKey < clampedStartKey) return [];

  const startDateUTC = new Date(`${clampedStartKey}T00:00:00.000Z`);
  const endDateUTC = new Date(`${clampedEndKey}T00:00:00.000Z`);

  const keys = [];
  for (
    let d = startDateUTC;
    d.getTime() <= endDateUTC.getTime();
    d = addDaysUTC(d, 1)
  ) {
    keys.push(d.toISOString().slice(0, 10));
  }

  return keys;
}

/**
 * Returns inclusive ISO date keys (YYYY-MM-DD) for the event range.
 * Falls back `endKey` to `startKey` when `endDate` is missing.
 */
export function getEventStartEndDateKeys(event) {
  const startKey = event?.isAllDay
    ? toLocalDateKeyFromIso(event?.startDate ?? "")
    : (event?.startDate ?? "").slice(0, 10);
  if (!startKey) return { startKey: null, endKey: null };

  const endKeyRaw = event?.isAllDay
    ? toLocalDateKeyFromIso(event?.endDate ?? event?.startDate ?? "")
    : (event?.endDate ?? event?.startDate ?? "").slice(0, 10);
  const endKey = endKeyRaw || startKey;
  return { startKey, endKey: endKey < startKey ? startKey : endKey };
}

/**
 * True when an event should be treated as a multi-day all-day range for
 * connected UI rendering (spans more than one day).
 */
export function eventIsAllDayMultiDay(event) {
  if (!event?.isAllDay) return false;
  const { startKey, endKey } = getEventStartEndDateKeys(event);
  if (!startKey || !endKey) return false;
  return endKey > startKey;
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
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  return (
    <Chip
      key={event.eventId}
      label={
        isMobile
          ? event.name.includes("|")
            ? event.name.split("|")[1].trim()
            : event.name
          : event.name
      }
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
        borderRadius: { xs: 0, sm: "12px" },
        height: 20,
        cursor: "pointer",
        "& .MuiChip-label": {
          px: { xs: 0.25, sm: 0.75 },
          overflow: "hidden",
          textOverflow: { xs: "clip", sm: "ellipsis" },
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
