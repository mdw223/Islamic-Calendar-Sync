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

function getHijriFormatterForTimezone(timezone) {
  if (!timezone) return HIJRI_NUMERIC_FORMATTER;
  return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: timezone,
  });
}

function buildUtcNoonDate(year, monthIndex, dayOfMonth) {
  return new Date(Date.UTC(year, monthIndex, dayOfMonth, 12, 0, 0, 0));
}

function buildAllDayIsoRange(anchorUtcDate, durationDays) {
  const spanDays = Math.max(1, durationDays ?? 1);
  const startDate = new Date(anchorUtcDate.getTime());
  const endDate = new Date(anchorUtcDate.getTime());
  endDate.setUTCDate(endDate.getUTCDate() + spanDays - 1);
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

/**
 * Build RRULE + Hijri metadata for persistence / .ics export, aligned with legacy
 * system-event template strings (Hijri month/day in BYMONTH / BYMONTHDAY).
 *
 * @param {Object} def — definition from islamicEvents.json
 * @returns {{ rrule: string | null, hijriMonth: number | null, hijriDay: number | null, durationDays: number }}
 */
export function buildIslamicRecurrenceFields(def) {
  const durationDays = def.durationDays ?? 1;
  const hijriDay = def.hijriDay ?? null;
  const hijriMonth = def.hijriMonth ?? null;

  if (def.repeatsEachMonth === true) {
    let rrule = null;
    if (hijriDay === 13 && durationDays === 3) {
      rrule = "FREQ=MONTHLY;BYMONTHDAY=13,14,15";
    } else if (hijriDay != null && durationDays >= 1) {
      const days = [];
      for (let d = hijriDay; d < hijriDay + durationDays; d++) {
        days.push(d);
      }
      rrule = `FREQ=MONTHLY;BYMONTHDAY=${days.join(",")}`;
    }
    return {
      rrule,
      hijriMonth,
      hijriDay,
      durationDays,
    };
  }

  if (hijriMonth == null || hijriDay == null) {
    return { rrule: null, hijriMonth, hijriDay, durationDays };
  }

  let rrule = `FREQ=YEARLY;BYMONTH=${hijriMonth};BYMONTHDAY=${hijriDay}`;
  if (durationDays > 1) {
    rrule += `;INTERVAL=${durationDays}`;
  }
  return { rrule, hijriMonth, hijriDay, durationDays };
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
export function generateIslamicEventsForYear(gregorianYear, definitions, timezone = null) {
  const events = [];
  const formatter = getHijriFormatterForTimezone(timezone);

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
    const date = buildUtcNoonDate(gregorianYear, 0, i + 1);
    if (date.getUTCFullYear() !== gregorianYear) break;

    const parts = formatter.formatToParts(date);
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
      const recurrence = buildIslamicRecurrenceFields(def);
      const allDayRange = buildAllDayIsoRange(d.date, def.durationDays ?? 1);

      events.push({
        islamicDefinitionId: def.id,
        name: `${def.titleAr} | ${def.titleEn}`,
        startDate: allDayRange.startDate,
        endDate: allDayRange.endDate,
        isAllDay: def.isAllDay ?? true,
        description: def.description ?? null,
        eventTypeId: def.eventTypeId ?? EventTypeId.CUSTOM,
        isTask: false,
        hide: false,
        eventTimezone: timezone,
        rrule: recurrence.rrule,
        hijriMonth: recurrence.hijriMonth,
        hijriDay: recurrence.hijriDay,
        durationDays: recurrence.durationDays,
        color: def.defaultColor ?? null,
      });
    }
  }

  return events;
}

/**
 * All occurrences of one definition between two Gregorian dates (inclusive span).
 * Used when expanding Islamic series masters for GET /events.
 *
 * @param {Object} definition — single entry from islamicEvents.json shape
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @param {string | null} timezone
 * @returns {Array<Object>} Same shape as generateIslamicEventsForYear items
 */
export function generateIslamicEventsForDefinitionInDateRange(
  definition,
  rangeStart,
  rangeEnd,
  timezone = null,
) {
  const startY = rangeStart.getFullYear();
  const endY = rangeEnd.getFullYear();
  const rs = rangeStart.getTime();
  const re = rangeEnd.getTime();
  const out = [];

  for (let y = startY; y <= endY; y++) {
    const yearEvents = generateIslamicEventsForYear(y, [definition], timezone);
    for (const ev of yearEvents) {
      const es = new Date(ev.startDate).getTime();
      const ee = new Date(ev.endDate).getTime();
      if (ee >= rs && es <= re) {
        out.push(ev);
      }
    }
  }
  return out;
}

/**
 * Build one persisted row per Islamic definition (not hidden) for the given
 * Gregorian years. Anchor dates are the earliest occurrence across those years.
 *
 * @param {number[]} years
 * @param {Array<Object>} definitions — merged defs with isHidden
 * @param {string | null} timezone
 * @returns {Array<Object>} Plain objects for EventDOA.upsertIslamicMaster
 */
export function buildIslamicMasterRowsForYears(years, definitions, timezone = null) {
  if (!years.length) return [];
  const sortedYears = [...years].sort((a, b) => a - b);
  const masters = [];

  for (const def of definitions) {
    if (def.isHidden) continue;

    let anchor = null;
    for (const y of sortedYears) {
      const evs = generateIslamicEventsForYear(y, [def], timezone);
      if (evs.length === 0) continue;
      evs.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      const first = evs[0];
      if (!anchor || new Date(first.startDate) < new Date(anchor.startDate)) {
        anchor = first;
      }
    }
    if (anchor) {
      masters.push({ ...anchor });
    }
  }

  return masters;
}
