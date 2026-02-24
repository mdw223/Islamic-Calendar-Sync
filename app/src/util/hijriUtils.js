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

// ---------------------------------------------------------------------------
// Hijri formatter — numeric variant so we get integers back instead of names.
// "en-u-ca-islamic-umalqura" is the Umm al-Qura calendar used in Saudi Arabia
// and is the standard reference for Islamic event dates.
// ---------------------------------------------------------------------------
const HIJRI_NUMERIC_FORMATTER = new Intl.DateTimeFormat(
  "en-u-ca-islamic-umalqura",
  { day: "numeric", month: "numeric", year: "numeric" }
);

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
 * Generate calendar event objects for every enabled Islamic event definition
 * that falls within the specified Gregorian year.
 *
 * How it works:
 *   1. We iterate over every calendar day in `gregorianYear`.
 *   2. For each day we compute its Hijri date via Intl.DateTimeFormat.
 *   3. We test each definition: does this Hijri date match the definition's
 *      trigger day (and month, unless `repeatsEachMonth` is true)?
 *   4. If matched and not already generated (tracked via a Set), we build a
 *      calendar-event-shaped object.
 *
 * ID scheme (important for sync deduplication):
 *   - `islamicDefinitionId`: the stable string id from islamicEvents.json
 *                             (e.g. "ramadan_begins"). Year-independent.
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
 *   The full array from islamicEvents.json.
 * @param {string[]} [disabledIds=[]]
 *   Definition IDs the user has disabled; these are skipped.
 * @returns {Array<Object>} Array of event-shaped plain objects ready to be
 *   merged into CalendarContext's events state / localStorage.
 */
export function generateIslamicEventsForYear(
  gregorianYear,
  definitions,
  disabledIds = []
) {
  const events = [];

  // Track which islamicEventKeys have already been emitted so that we never
  // produce two entries for the same semantic event (prevents duplicates when
  // the same Hijri date appears twice within a single Gregorian year).
  const seen = new Set();

  // Iterate every day of the Gregorian year.
  // Using day-of-year counting avoids month arithmetic and naturally handles
  // leap years (day 366 simply returns a Date in the next year, which we break on).
  for (let dayOfYear = 1; dayOfYear <= 366; dayOfYear++) {
    // Build a Date at midnight local time for this day of the year.
    const date = new Date(gregorianYear, 0, dayOfYear);

    // Stop once we've crossed into the next Gregorian year (handles leap years).
    if (date.getFullYear() !== gregorianYear) break;

    const hijri = getHijriNumericParts(date);

    for (const def of definitions) {
      // Skip events the user has explicitly disabled.
      if (disabledIds.includes(def.id)) continue;

      // --- Match logic -------------------------------------------------------
      // The trigger day must equal the definition's hijriDay.
      const dayMatches = hijri.day === def.hijriDay;

      // For `repeatsEachMonth: true` (White Days), any Hijri month is valid.
      // For all other definitions, the Hijri month must match exactly.
      const monthMatches =
        def.repeatsEachMonth === true || hijri.month === def.hijriMonth;

      if (!dayMatches || !monthMatches) continue;
      // -----------------------------------------------------------------------

      // Build the deduplication key.
      // Monthly repeating events include the Hijri month so that, e.g.,
      // Safar white days and Ramadan white days get distinct keys.
      const islamicEventKey = def.repeatsEachMonth
        ? `${def.id}_${hijri.month}_${hijri.year}`
        : `${def.id}_${hijri.year}`;

      // Skip if we already emitted this event in this run.
      if (seen.has(islamicEventKey)) continue;
      seen.add(islamicEventKey);

      // --- Build the date range ---------------------------------------------
      // startDate: midnight on the trigger day (ISO string).
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      // endDate: last millisecond of the final day of the event.
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + (def.durationDays ?? 1) - 1);
      endDate.setHours(23, 59, 59, 999);
      // -----------------------------------------------------------------------

      events.push({
        // Local string ID — becomes an integer after a successful backend sync.
        eventId: `islamic_${islamicEventKey}`,

        // These two fields are carried through localStorage and sent to the
        // backend so it can perform upsert deduplication.
        islamicDefinitionId: def.id,
        islamicEventKey,

        // Calendar display fields — bilingual name keeps both scripts visible.
        name: `${def.titleAr} | ${def.titleEn}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay: def.isAllDay ?? true,
        description: def.description ?? null,

        // Backend FK fields (safe to reference even before sync because
        // localStorage has no FK enforcement).
        eventTypeId: def.eventTypeId ?? 4,

        // Flags — Islamic events are never tasks and start un-hidden.
        isCustom: false,
        isTask: false,
        hide: false,
      });
    }
  }

  return events;
}
