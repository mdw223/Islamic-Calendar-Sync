/**
 * hijriUtils.js
 *
 * Utilities for converting Gregorian dates to Hijri (Islamic) dates.
 *
 * No external libraries are needed — we rely on the browser's built-in
 * Intl.DateTimeFormat API with the "islamic-umalqura" calendar, exactly as
 * used elsewhere in the Calendar component.
 *
 * Event generation has moved server-side — see POST /events/generate.
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

