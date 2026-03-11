/**
 * hijriUtils.js (backend)
 *
 * Gregorian→Hijri conversion and Islamic event generation logic.
 * Uses Node.js built-in Intl.DateTimeFormat with "islamic-umalqura" calendar
 * (Node 22 ships full ICU by default).
 *
 * Ported from app/src/util/HijriUtils.js — same algorithm, but returns
 * plain objects instead of validated Event model instances (the DOA handles
 * persistence and validation).
 */

import { EventTypeId } from "../Constants.js";

// Hijri numeric formatter — instantiated once for performance.
const HIJRI_NUMERIC_FORMATTER = new Intl.DateTimeFormat(
  "en-u-ca-islamic-umalqura",
  { day: "numeric", month: "numeric", year: "numeric" },
);

/**
 * Convert a Gregorian Date to its Hijri numeric components.
 *
 * @param {Date} date
 * @returns {{ day: number, month: number, year: number }}
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
 * Generate Islamic event objects for every enabled definition that falls
 * within the specified Gregorian year.
 *
 * Performance: builds a definition lookup map keyed by (hijriDay, hijriMonth)
 * so the inner loop is O(1) per day instead of O(definitions).
 *
 * @param {number} gregorianYear
 * @param {Array<Object>} definitions — entries from islamicEvents.json,
 *   each may have `isHidden: true` to be skipped.
 * @returns {Array<Object>} Plain event objects ready for EventDOA.bulkUpsert.
 */
export function generateIslamicEventsForYear(gregorianYear, definitions) {
  const events = [];
  const seen = new Set();

  // Build lookup maps
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

  if (byDayMonth.size === 0 && byDayOnly.length === 0) return events;

  // Pre-compute Hijri parts for every day of the year
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

  // Match days to definitions
  for (let i = 0; i < dayData.length; i++) {
    const d = dayData[i];
    if (!d) break;

    const key = `${d.hijriDay}_${d.hijriMonth}`;
    const exactMatches = byDayMonth.get(key);
    const monthlyMatches =
      byDayOnly.length > 0
        ? byDayOnly.filter((def) => def.hijriDay === d.hijriDay)
        : undefined;

    if (!exactMatches && (!monthlyMatches || monthlyMatches.length === 0)) {
      continue;
    }

    const candidates = [...(exactMatches ?? []), ...(monthlyMatches ?? [])];

    for (const def of candidates) {
      // ...existing code...

      const startDate = new Date(d.date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(d.date);
      endDate.setDate(endDate.getDate() + (def.durationDays ?? 1) - 1);
      endDate.setHours(23, 59, 59, 999);

      events.push({
        islamicDefinitionId: def.id,
        name: `${def.titleAr} | ${def.titleEn}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay: def.isAllDay ?? true,
        description: def.description ?? null,
        eventTypeId: def.eventTypeId ?? EventTypeId.CUSTOM,
        isCustom: false,
        isTask: false,
        hide: false,
      });
    }
  }

  return events;
}
