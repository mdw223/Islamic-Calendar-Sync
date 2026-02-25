/**
 * hijriUtils.js
 *
 * Utilities for converting Gregorian dates to Hijri (Islamic) dates and for
 * generating calendar event objects for all Islamic events in a given
 * Gregorian year.
 *
 * No external libraries are needed — we rely on the browser's built-in
 * Intl.DateTimeFormat API with the "islamic-umalqura" calendar, exactly as
 * used elsewhere in the Calendar component.
 */

import { EventTypeId } from "../constants";
import { createEvent } from "../models/Event";

// ---------------------------------------------------------------------------
// Hijri formatter — numeric variant so we get integers back instead of names.
// "en-u-ca-islamic-umalqura" is the Umm al-Qura calendar used in Saudi Arabia
// and is the standard reference for Islamic event dates.
// ---------------------------------------------------------------------------
const HIJRI_NUMERIC_FORMATTER = new Intl.DateTimeFormat(
  "en-u-ca-islamic-umalqura",
  { day: "numeric", month: "numeric", year: "numeric" }
);

// Reused across every Hijri conversion call — instantiated once to avoid
// repeated construction overhead inside render loops.
export const HIJRI_FORMATTER = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Convert a Gregorian Date to its Hijri numeric components.
 *
 * @param {Date} date - A JavaScript Date object (local time).
 * @returns {{ day: number, month: number, year: number }}
 *   Hijri day (1–30), month (1–12), and year (e.g. 1447).
 */
export function getHijriNumericParts(date) {
  const parts = HIJRI_NUMERIC_FORMATTER.formatToParts(date);
  return {
    day: parseInt(parts.find((p) => p.type === "day")?.value ?? "0", 10),
    month: parseInt(parts.find((p) => p.type === "month")?.value ?? "0", 10),
    year: parseInt(parts.find((p) => p.type === "year")?.value ?? "0", 10),
  };
}

/**
 * Converts a Gregorian Date to its Hijri equivalent using the Umm al-Qura
 * calendar via the browser's built-in Intl API.
 */
export function getHijriParts(date) {
  const parts = HIJRI_FORMATTER.formatToParts(date);
  return {
    day: parts.find((p) => p.type === "day")?.value ?? "",
    month: parts.find((p) => p.type === "month")?.value ?? "",
    year: parts.find((p) => p.type === "year")?.value ?? "",
  };
}

/**
 * Returns a human-readable label describing which Hijri month(s) overlap with
 * a given Gregorian month.
 */
export function getHijriMonthRangeLabel(year, month) {
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

/**
 * Generate calendar event objects for every enabled Islamic event definition
 * that falls within the specified Gregorian year.
 *
 * Performance: builds a definition lookup map keyed by (hijriDay, hijriMonth)
 * so the inner loop is O(1) per day instead of O(definitions). Intl calls
 * are made once per calendar day (~365) instead of once per day×definition.
 *
 * ID scheme (important for sync deduplication):
 *   - `islamicDefinitionId`: the stable string id from islamicEvents.json
 *                             (e.g. "month_start_ramadan"). Year-independent.
 *   - `islamicEventKey`:      year+Hijri-context string used as the backend
 *                             upsert key per (userId, islamicEventKey).
 *                             Annual events:   "<id>_<hijriYear>"       e.g. "ramadan_begins_1447"
 *                             Monthly events:  "<id>_<hijriMonth>_<hijriYear>"  e.g. "white_days_9_1447"
 *   - `eventId` (local):      "islamic_" + islamicEventKey — a plain string
 *                             used as the primary key while the event is
 *                             unsynced. Replaced by the backend integer after
 *                             a successful sync.
 *
 * Edge cases handled:
 *   - A Gregorian year spans two Hijri years (e.g. 2026 contains parts of
 *     1447 and 1448). Each Hijri-year occurrence gets a distinct key so both
 *     are generated without collision.
 *   - Multi-day events (Hajj, White Days, etc.) are created only once —
 *     on the trigger day — with endDate offset by durationDays.
 *   - Definitions for different events that share the same Hijri date
 *     (e.g. Islamic New Year and Muharram month-start, both on 1 Muharram)
 *     each produce their own event.
 *
 * @param {number} gregorianYear - The Gregorian year to generate events for.
 * @param {Array<import("../data/islamicEvents.json")["events"][number]>} definitions
 *   The full array from islamicEvents.json (each may have `isHidden`).
 * @returns {Array<Object>} Array of event-shaped plain objects ready to be
 *   merged into CalendarContext's events state / localStorage.
 */
export function generateIslamicEventsForYear(gregorianYear, definitions) {
  const events = [];
  const seen = new Set();

  // ── Build lookup maps so the inner loop is a hash hit, not a scan ──────
  // Key: "day_month" → array of definitions that trigger on that Hijri date.
  // Separate list for repeatsEachMonth definitions (matched on any month).
  const byDayMonth = new Map();
  const byDayOnly = [];

  for (const def of definitions) {
    if (def.isHidden) continue;

    if (def.repeatsEachMonth === true) {
      byDayOnly.push(def);
    } else {
      const key = `${def.hijriDay}_${def.hijriMonth}`;
      if (!byDayMonth.has(key)) byDayMonth.set(key, []);
      byDayMonth.get(key).push(def);
    }
  }

  // Early exit: nothing to generate if every definition is hidden.
  if (byDayMonth.size === 0 && byDayOnly.length === 0) return events;

  // ── Pre-compute Hijri parts for every day of the year in one pass ──────
  // This makes exactly 365–366 Intl.formatToParts calls total (down from
  // 365 × definitions in the previous implementation).
  const isLeap =
    (gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) ||
    gregorianYear % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;

  const dayData = new Array(daysInYear);
  for (let i = 0; i < daysInYear; i++) {
    const date = new Date(gregorianYear, 0, i + 1);
    if (date.getFullYear() !== gregorianYear) break;

    const parts = HIJRI_NUMERIC_FORMATTER.formatToParts(date);
    dayData[i] = {
      date,
      hijriDay: parseInt(parts.find((p) => p.type === "day")?.value ?? "0", 10),
      hijriMonth: parseInt(parts.find((p) => p.type === "month")?.value ?? "0", 10),
      hijriYear: parseInt(parts.find((p) => p.type === "year")?.value ?? "0", 10),
    };
  }

  // ── Match days to definitions via lookup ───────────────────────────────
  for (let i = 0; i < dayData.length; i++) {
    const d = dayData[i];
    if (!d) break;

    // Collect candidate definitions for this Hijri date.
    const key = `${d.hijriDay}_${d.hijriMonth}`;
    const exactMatches = byDayMonth.get(key);
    const monthlyMatches =
      byDayOnly.length > 0
        ? byDayOnly.filter((def) => def.hijriDay === d.hijriDay)
        : undefined;

    // Skip this day entirely if nothing matches — avoids object creation.
    if (!exactMatches && (!monthlyMatches || monthlyMatches.length === 0)) {
      continue;
    }

    const candidates = [...(exactMatches ?? []), ...(monthlyMatches ?? [])];

    for (const def of candidates) {
      // Build the deduplication key.
      const islamicEventKey = def.repeatsEachMonth
        ? `${def.id}_${d.hijriMonth}_${d.hijriYear}`
        : `${def.id}_${d.hijriYear}`;

      if (seen.has(islamicEventKey)) continue;
      seen.add(islamicEventKey);

      // --- Build the date range -------------------------------------------
      const startDate = new Date(d.date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(d.date);
      endDate.setDate(endDate.getDate() + (def.durationDays ?? 1) - 1);
      endDate.setHours(23, 59, 59, 999);

      // createEvent() validates every field and throws on bad data, so
      // malformed definitions or date-math bugs are caught immediately.
      events.push(
        createEvent({
          eventId: `islamic_${islamicEventKey}`,
          islamicDefinitionId: def.id,
          islamicEventKey,
          name: `${def.titleAr} | ${def.titleEn}`,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          isAllDay: def.isAllDay ?? true,
          description: def.description ?? null,
          eventTypeId: def.eventTypeId ?? EventTypeId.CUSTOM,
          isCustom: false,
          isTask: false,
          hide: false,
        }),
      );
    }
  }

  return events;
}
