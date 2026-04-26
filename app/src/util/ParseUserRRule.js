/**
 * Best-effort parse of user-authored RRULE (no DTSTART) into EventModal form fields.
 */

const DAY_MAP = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/**
 * @param {string | null | undefined} rrule
 * @returns {{
 *   recurrenceFreq: string,
 *   recurrenceInterval: number,
 *   recurrenceEndType: string,
 *   recurrenceUntil: string,
 *   recurrenceCount: number,
 *   recurrenceWeekdays: number[],
 * } | null}
 */
export function parseUserRRuleToRecurrenceForm(rrule) {
  if (!rrule || typeof rrule !== "string") return null;
  const s = rrule.trim();
  if (!s) return null;

  const freqM = /FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i.exec(s);
  if (!freqM) return null;

  const recurrenceFreq = freqM[1].toLowerCase();
  let recurrenceInterval = 1;
  const intM = /INTERVAL=(\d+)/i.exec(s);
  if (intM) recurrenceInterval = Math.max(1, parseInt(intM[1], 10) || 1);

  let recurrenceEndType = "never";
  let recurrenceUntil = "";
  let recurrenceCount = 10;

  const untilM = /UNTIL=([^;]+)/i.exec(s);
  if (untilM) {
    recurrenceEndType = "until";
    const raw = untilM[1];
    const y = raw.slice(0, 4);
    const mo = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    if (y && mo && d) recurrenceUntil = `${y}-${mo}-${d}`;
  }

  const countM = /COUNT=(\d+)/i.exec(s);
  if (countM && recurrenceEndType === "never") {
    recurrenceEndType = "count";
    recurrenceCount = Math.max(1, parseInt(countM[1], 10) || 1);
  }

  const recurrenceWeekdays = [];
  const bydayM = /BYDAY=([^;]+)/i.exec(s);
  if (bydayM && recurrenceFreq === "weekly") {
    const parts = bydayM[1].split(",");
    for (const p of parts) {
      const code = p.trim().replace(/^[+-]?\d+/, "").toUpperCase();
      if (DAY_MAP[code] !== undefined) recurrenceWeekdays.push(DAY_MAP[code]);
    }
  }

  return {
    recurrenceFreq,
    recurrenceInterval,
    recurrenceEndType,
    recurrenceUntil,
    recurrenceCount,
    recurrenceWeekdays,
  };
}
