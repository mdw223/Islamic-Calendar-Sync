/**
 * Build iCalendar (RFC 5545) text from expanded event rows.
 * Mirrors app/src/util/Ics.js addEvent/calendar assembly; uses CRLF; snapshot export omits RRULE.
 */

import { appConfig } from "../Config.js";

const CRLF = "\r\n";

/**
 * @param {Date} date
 * @param {string | null | undefined} timezone IANA zone, or omit for local wall-time of Date in system TZ
 */
function datePartsForTimezone(date, timezone) {
  if (!timezone) {
    return {
      year: (`0000${date.getFullYear()}`).slice(-4),
      month: (`00${date.getMonth() + 1}`).slice(-2),
      day: (`00${date.getDate()}`).slice(-2),
      hour: (`00${date.getHours()}`).slice(-2),
      minute: (`00${date.getMinutes()}`).slice(-2),
      second: (`00${date.getSeconds()}`).slice(-2),
    };
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const pick = (type) => parts.find((p) => p.type === type)?.value;
  return {
    year: pick("year") ?? "0000",
    month: pick("month") ?? "01",
    day: pick("day") ?? "01",
    hour: pick("hour") ?? "00",
    minute: pick("minute") ?? "00",
    second: pick("second") ?? "00",
  };
}

/**
 * @param {{
 *   name?: string | null,
 *   description?: string | null,
 *   location?: string | null,
 *   startDate: string,
 *   endDate: string,
 *   isAllDay?: boolean | null,
 *   eventTimezone?: string | null,
 * }} ev
 * @param {number} index UID suffix
 * @param {string} uidDomain
 * @param {string | null} defaultTimezone when event has no eventTimezone (server export uses UTC per product choice)
 */
function buildVeventBlock(ev, index, uidDomain, defaultTimezone) {
  const subject = ev.name ?? "";
  const description = escapeIcsText(ev.description) ?? "";
  const location = escapeIcsText(ev.location) ?? "";
  const begin = ev.startDate;
  const stop = ev.endDate;
  const allDay = ev.isAllDay ?? false;
  const eventTimezone = ev.eventTimezone || defaultTimezone || null;

  const start_date = new Date(begin);
  const end_date = new Date(stop);
  if (Number.isNaN(start_date.getTime()) || Number.isNaN(end_date.getTime())) {
    return null;
  }

  const now_date = new Date();
  const startParts = datePartsForTimezone(start_date, eventTimezone);
  const endParts = datePartsForTimezone(end_date, eventTimezone);
  const nowParts = datePartsForTimezone(now_date, eventTimezone);

  // Same as Ics.js: string-concatenate so all-midnight yields "000000000000" == 0 in != comparison
  const start_hours = startParts.hour;
  const start_minutes = startParts.minute;
  const start_seconds = startParts.second;
  const end_hours = endParts.hour;
  const end_minutes = endParts.minute;
  const end_seconds = endParts.second;
  let start_time = "";
  let end_time = "";
  if (
    start_hours +
      start_minutes +
      start_seconds +
      end_hours +
      end_minutes +
      end_seconds !=
    0
  ) {
    start_time = `T${start_hours}${start_minutes}${start_seconds}`;
    end_time = `T${end_hours}${end_minutes}${end_seconds}`;
  }
  const now_time = `T${nowParts.hour}${nowParts.minute}${nowParts.second}`;

  let start = `${startParts.year}${startParts.month}${startParts.day}${start_time}`;
  let end = `${endParts.year}${endParts.month}${endParts.day}${end_time}`;
  const now = `${nowParts.year}${nowParts.month}${nowParts.day}${now_time}`;

  if (allDay) {
    start = `${startParts.year}${startParts.month}${startParts.day}`;
    // Create exclusive end date (day after) using timezone-aware parts
    const exclusiveEndDate = new Date(`${endParts.year}-${endParts.month}-${endParts.day}T00:00:00`);
    exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
    const ey = (`0000${exclusiveEndDate.getFullYear()}`).slice(-4);
    const em = (`00${exclusiveEndDate.getMonth() + 1}`).slice(-2);
    const ed = (`00${exclusiveEndDate.getDate()}`).slice(-2);
    end = `${ey}${em}${ed}`;
  }

  const dtStartLine = allDay
    ? `DTSTART;VALUE=DATE:${start}`
    : eventTimezone
      ? `DTSTART;TZID=${eventTimezone}:${start}`
      : `DTSTART;VALUE=DATE-TIME:${start}`;
  const dtEndLine = allDay
    ? `DTEND;VALUE=DATE:${end}`
    : eventTimezone
      ? `DTEND;TZID=${eventTimezone}:${end}`
      : `DTEND;VALUE=DATE-TIME:${end}`;

  const lines = [
    "BEGIN:VEVENT",
    `UID:${index}@${uidDomain}`,
    "CLASS:PUBLIC",
    `DESCRIPTION:${description}`,
    `DTSTAMP;VALUE=DATE-TIME:${now}`,
    dtStartLine,
    dtEndLine,
    `LOCATION:${location}`,
    `SUMMARY;LANGUAGE=en-us:${subject}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
  ];

  return lines.join(CRLF);
}

/**
 * @param {Array<Record<string, unknown>>} events expanded calendar rows (same shape as GET /events)
 * @param {{ prodId?: string, uidDomain?: string, defaultTimezone?: string | null }} [options]
 * @returns {string} Full .ics document (empty VCALENDAR if no valid events)
 */
export function buildIcsString(events, options = {}) {
  const prodId = options.prodId ?? "-//IslamicCalendarSync//EN";
  const uidDomain = options.uidDomain ?? "islamiccalendarsync.app";
  // When eventTimezone is missing on a row, use UTC (no per-session UI timezone on API).
  const defaultTimezone = options.defaultTimezone ?? "UTC";
  const addSubscriptionUrl = options.addSubscriptionUrl ?? false;

  const calendarStart = [
    "BEGIN:VCALENDAR",
    `PRODID:${prodId}`,
    "VERSION:2.0",
  ].join(CRLF);

  const blocks = [];
  let index = 0;
  for (const ev of events) {
    if (ev.startDate == null || ev.endDate == null) continue;
    ev.description = ev.description + `\n\nLearn more: ${appConfig.BASE_URL}/learn`;
    const block = buildVeventBlock(
      {
        name: ev.name,
        description: ev.description,
        location: ev.location,
        startDate: String(ev.startDate),
        endDate: String(ev.endDate),
        isAllDay: ev.isAllDay,
        eventTimezone: ev.eventTimezone,
      },
      index,
      uidDomain,
      defaultTimezone,
    );
    if (block) {
      blocks.push(block);
      index += 1;
    }
  }

  const body = blocks.length > 0 ? `${CRLF}${blocks.join(CRLF)}` : "";
  return `${calendarStart}${body}${CRLF}END:VCALENDAR`;
}

function escapeIcsText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
