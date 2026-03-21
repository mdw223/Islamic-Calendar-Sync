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

// ── Hijri formatter ─────────────────────────────────────────────────────────
const HIJRI_NUMERIC_FORMATTER = new Intl.DateTimeFormat(
  "en-u-ca-islamic-umalqura",
  { day: "numeric", month: "numeric", year: "numeric" },
);

// ── Base definitions ────────────────────────────────────────────────────────

export function getBaseDefinitions() {
  return islamicEventsData.events;
}

// ── Merged definitions (base + Dexie preferences) ───────────────────────────

export async function getMergedDefinitions() {
  const baseDefs = getBaseDefinitions();
  const prefs = await db.definitionPreferences.toArray();
  const prefMap = new Map(prefs.map((p) => [p.definitionId, p.isHidden]));

  return baseDefs.map((def) => ({
    ...def,
    isHidden: prefMap.has(def.id) ? prefMap.get(def.id) : def.isHidden ?? false,
  }));
}

// ── Event generation (pure, no I/O) ─────────────────────────────────────────

function getHijriFormatterForTimezone(timezone) {
  if (!timezone) return HIJRI_NUMERIC_FORMATTER;
  return new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: timezone,
  });
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
    const date = new Date(gregorianYear, 0, i + 1);
    if (date.getFullYear() !== gregorianYear) break;

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
        isTask: false,
        hide: false,
        eventTimezone: timezone,
      });
    }
  }

  return events;
}

// ── Generate + persist to Dexie ─────────────────────────────────────────────

/**
 * Generate Islamic events for one or more years and upsert them into IndexedDB.
 *
 * @param {number[]} years - Array of Gregorian years
 * @returns {Promise<{ events: Object[], generatedCount: number }>}
 */
export async function generateForOfflineUser(years, timezone = null) {
  const mergedDefs = await getMergedDefinitions();

  const allGenerated = [];
  for (const year of years) {
    const generated = generateIslamicEventsForYear(year, mergedDefs, timezone);
    allGenerated.push(...generated);
  }

  if (allGenerated.length === 0) {
    return { events: [], generatedCount: 0 };
  }

  const now = new Date().toISOString();
  await db.events.bulkAdd(
    allGenerated.map((e) => ({ ...e, createdAt: now, updatedAt: now })),
  );

  const allEvents = await db.events.toArray();
  return {
    events: allEvents.map(({ id, ...rest }) => ({ ...rest, eventId: id })),
    generatedCount: allGenerated.length,
  };
}
