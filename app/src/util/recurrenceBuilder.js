/**
 * Build RFC 5545 RRULE strings (without DTSTART) for custom user events.
 */

const BYDAY_NAMES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/**
 * @param {Date} d
 * @returns {string} UNTIL in UTC compact form
 */
function formatUntilUtc(d) {
  const x = new Date(d.getTime());
  x.setUTCHours(23, 59, 59, 0);
  return `${x.getUTCFullYear()}${String(x.getUTCMonth() + 1).padStart(2, "0")}${String(x.getUTCDate()).padStart(2, "0")}T${String(x.getUTCHours()).padStart(2, "0")}${String(x.getUTCMinutes()).padStart(2, "0")}${String(x.getUTCSeconds()).padStart(2, "0")}Z`;
}

/**
 * @param {{
 *   freq: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
 *   interval?: number,
 *   byweekday?: number[],
 *   endType: 'never' | 'until' | 'count',
 *   untilDate?: string,
 *   count?: number,
 * }} opts
 * @param {Date} dtstart — first occurrence start (local)
 * @returns {string | null} RRULE body only, or null if none
 */
export function buildRecurrenceRRule(opts, dtstart) {
  if (!opts || opts.freq === "none") return null;

  const interval = Math.max(1, parseInt(String(opts.interval ?? 1), 10) || 1);
  const parts = [];

  switch (opts.freq) {
    case "daily":
      parts.push("FREQ=DAILY");
      break;
    case "weekly": {
      parts.push("FREQ=WEEKLY");
      let days = opts.byweekday;
      if (!days?.length) {
        days = [dtstart.getDay()];
      }
      const unique = [...new Set(days)].sort((a, b) => a - b);
      parts.push(`BYDAY=${unique.map((i) => BYDAY_NAMES[i]).join(",")}`);
      break;
    }
    case "monthly":
      parts.push("FREQ=MONTHLY");
      parts.push(`BYMONTHDAY=${dtstart.getDate()}`);
      break;
    case "yearly":
      parts.push("FREQ=YEARLY");
      parts.push(`BYMONTH=${dtstart.getMonth() + 1}`);
      parts.push(`BYMONTHDAY=${dtstart.getDate()}`);
      break;
    default:
      return null;
  }

  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  if (opts.endType === "until" && opts.untilDate) {
    const u = new Date(`${opts.untilDate}T23:59:59`);
    if (!Number.isNaN(u.getTime())) {
      parts.push(`UNTIL=${formatUntilUtc(u)}`);
    }
  } else if (opts.endType === "count" && opts.count) {
    const c = Math.min(999, Math.max(1, parseInt(String(opts.count), 10) || 1));
    parts.push(`COUNT=${c}`);
  }

  return parts.join(";");
}
