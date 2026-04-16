/**
 * IslamicEventService.js  (client-side)
 *
 * Port of the backend's IslamicEventService + HijriUtils.generateIslamicEventsForYear.
 * Used by OfflineClient to generate Islamic calendar events entirely in the
 * browser for unauthenticated / offline guest users.
 *
 * The algorithm is identical to api/src/util/HijriUtils.js — it builds lookup
 * maps keyed by (hijriDay, hijriMonth), iterates every day of the Gregorian
 * year
 */

import islamicEventsData from "../data/islamicEvents.json";
import { EventTypeId } from "../Constants";
import db from "../util/OfflineDb";

const EVENT_TYPE_DEFAULT_COLORS = Object.freeze({
  1: "#2E7D32",
  2: "#0288D1",
  3: "#F59E0B",
  4: "#7C3AED",
});

function resolveDefinitionDefaultColor(definition) {
  return (
    definition?.defaultColor ??
    EVENT_TYPE_DEFAULT_COLORS[definition?.eventTypeId] ??
    EVENT_TYPE_DEFAULT_COLORS[EventTypeId.CUSTOM]
  );
}

// ── Hijri formatter ─────────────────────────────────────────────────────────
const HIJRI_NUMERIC_FORMATTER = new Intl.DateTimeFormat(
  "en-u-ca-islamic-umalqura",
  { day: "numeric", month: "numeric", year: "numeric" },
);

// ── Base definitions ────────────────────────────────────────────────────────

export function getBaseDefinitions() {
  return islamicEventsData.events.map((def) => ({
    ...def,
    defaultColor: resolveDefinitionDefaultColor(def),
  }));
}

// ── Merged definitions (base + Dexie preferences) ───────────────────────────

export async function getMergedDefinitions() {
  const baseDefs = getBaseDefinitions();
  const prefs = await db.definitionPreferences.toArray();
  const prefMap = new Map(prefs.map((p) => [p.definitionId, p]));

  return baseDefs.map((def) => ({
    ...def,
    isHidden: prefMap.has(def.id)
      ? prefMap.get(def.id).isHidden
      : def.isHidden ?? false,
    defaultColor: prefMap.get(def.id)?.defaultColor ?? resolveDefinitionDefaultColor(def),
  }));
}

// ── Event generation (pure, no I/O) ─────────────────────────────────────────
// Mirrors api/src/util/HijriUtils.js buildIslamicRecurrenceFields.

function buildIslamicRecurrenceFields(def) {
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

export function generateIslamicEventsForYear(gregorianYear, definitions, timezone = null) {
  const events = [];

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

  const isLeap =
    (gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) ||
    gregorianYear % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;

  const formatter = getHijriFormatterForTimezone(timezone);
  const dayData = new Array(daysInYear);
  for (let i = 0; i < daysInYear; i++) {
    const date = buildUtcNoonDate(gregorianYear, 0, i + 1);
    if (date.getUTCFullYear() !== gregorianYear) break;

    const parts = formatter.formatToParts(date);
    dayData[i] = {
      date,
      hijriDay: parseInt(
        parts.find((p) => p.type === "day")?.value ?? "0",
        10,
      ),
      hijriMonth: parseInt(
        parts.find((p) => p.type === "month")?.value ?? "0",
        10,
      ),
      hijriYear: parseInt(
        parts.find((p) => p.type === "year")?.value ?? "0",
        10,
      ),
    };
  }

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
 * All occurrences of one definition between two Gregorian dates (inclusive).
 * Mirrors api/src/util/HijriUtils.js generateIslamicEventsForDefinitionInDateRange.
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
 * One master row per Islamic definition for the given years (earliest anchor).
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

// ── Generate + persist to Dexie ─────────────────────────────────────────────

/**
 * Upsert Islamic series masters into IndexedDB (one row per definition).
 *
 * @param {number[]} years - Array of Gregorian years
 * @returns {Promise<{ events: Object[], generatedCount: number }>}
 */
export async function generateForOfflineUser(
  years,
  timezone = null,
  includeAll = false,
) {
  const mergedDefs = await getMergedDefinitions();
  const allDefs = getBaseDefinitions().map((def) => ({ ...def, isHidden: false }));
  const defs = includeAll ? allDefs : mergedDefs;
  const allMasters = buildIslamicMasterRowsForYears(years, defs, timezone);

  if (allMasters.length === 0) {
    return { events: [], generatedCount: 0 };
  }

  const now = new Date().toISOString();
  for (const master of allMasters) {
    const existing = await db.events
      .where("islamicDefinitionId")
      .equals(master.islamicDefinitionId)
      .first();
    const row = {
      ...master,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (existing) {
      await db.events.update(existing.id, row);
    } else {
      await db.events.add(row);
    }
  }

  return { events: [], generatedCount: allMasters.length };
}
