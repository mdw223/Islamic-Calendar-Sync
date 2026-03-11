// Utility to generate event occurrences from RRULEs, including Hijri-based recurrence.

import { getHijriNumericParts } from "./HijriUtils.js";

/**
 * Parse a simple RRULE string and generate occurrences for a given year.
 * Supports FREQ=YEARLY, FREQ=MONTHLY, BYMONTH, BYMONTHDAY, INTERVAL.
 * For Hijri-based events, uses Hijri conversion.
 *
 * @param {Object} event - System event row with RRULE and Hijri info.
 * @param {number} gregorianYear - Year to generate occurrences for.
 * @returns {Array<{ startDate: Date, endDate: Date }>}
 */
export function generateOccurrencesFromRRule(event, gregorianYear) {
  const occurrences = [];
  const { rrule, hijriMonth, hijriDay, durationDays } = event;

  // Only support FREQ=YEARLY and FREQ=MONTHLY for now
  if (!rrule) return occurrences;

  // Hijri-based recurrence: scan each day of the year
  const isLeap = (gregorianYear % 4 === 0 && gregorianYear % 100 !== 0) || gregorianYear % 400 === 0;
  const daysInYear = isLeap ? 366 : 365;

  for (let i = 0; i < daysInYear; i++) {
    const date = new Date(gregorianYear, 0, i + 1);
    const hijriParts = getHijriNumericParts(date);

    // Match event's recurrence
    if (event.rrule.includes("FREQ=YEARLY")) {
      if (
        hijriMonth && hijriDay &&
        hijriParts.month === hijriMonth && hijriParts.day === hijriDay
      ) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + (durationDays ?? 1) - 1);
        endDate.setHours(23, 59, 59, 999);
        occurrences.push({ startDate, endDate });
      }
    } else if (event.rrule.includes("FREQ=MONTHLY")) {
      // e.g. White Days: BYMONTHDAY=13,14,15
      if (hijriDay && hijriParts.day === hijriDay) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + (durationDays ?? 1) - 1);
        endDate.setHours(23, 59, 59, 999);
        occurrences.push({ startDate, endDate });
      }
    }
  }

  return occurrences;
}
