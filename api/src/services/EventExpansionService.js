/**
 * Expands persisted Event rows into calendar instances for a date range.
 * - Islamic masters (islamicDefinitionId set): Hijri-based occurrences.
 * - User recurring (rrule set, no islamicDefinitionId): Gregorian RRule.
 * - Otherwise: single instance if it overlaps the range.
 */

import * as rruleModule from "rrule";
import { Event } from "../model/models/Event.js";
import { getBaseDefinitions } from "./IslamicEventService.js";
import { generateIslamicEventsForDefinitionInDateRange } from "../util/HijriUtils.js";

/** Node loads `rrule` as CJS: named exports sit on `default`, not the namespace root. */
const RRule =
  rruleModule.default?.RRule ??
  rruleModule.default?.default?.RRule ??
  rruleModule.RRule;

// recomputed only on server restart or per running node process
const definitionCache = new Map(getBaseDefinitions().map((d) => [d.id, d]));

/** @type {Map<string, Object> | null} */
function getDefinitionById(id) {
  return definitionCache.get(id) ?? null;
}

/**
 * @param {string | null | undefined} rrule
 * @returns {{ ok: true, value: string } | { ok: false, message: string }}
 */
export function validateStoredUserRRule(rrule) {
  if (rrule == null || rrule === "") {
    return { ok: true, value: "" };
  }
  if (typeof rrule !== "string" || rrule.length > 512) {
    return { ok: false, message: "RRule must be a string of 512 characters or fewer." };
  }
  const trimmed = rrule.trim();
  if (!/^[A-Za-z0-9=;,+.\-/_:\s]+$/.test(trimmed)) {
    return { ok: false, message: "RRule contains invalid characters." };
  }
  if (RRule == null || typeof RRule.parseString !== "function") {
    return {
      ok: false,
      message: "Recurrence validation unavailable (rrule library not loaded correctly).",
    };
  }
  try {
    const parsed = RRule.parseString(`RRULE:${trimmed.replace(/^RRULE:/i, "")}`);
    if (parsed == null || parsed.freq === undefined) {
      return { ok: false, message: "RRule must include a valid FREQ." };
    }
    new RRule({ ...parsed, dtstart: new Date("2020-01-01T12:00:00.000Z") }); // dummy date to validate the rrule
  } catch {
    return { ok: false, message: "Invalid RRule string." };
  }
  return { ok: true, value: trimmed.replace(/^RRULE:/i, "") };
}

function eventOverlapsRange(startIso, endIso, rangeStart, rangeEnd) {
  const es = new Date(startIso).getTime();
  const ee = new Date(endIso).getTime();
  return ee >= rangeStart.getTime() && es <= rangeEnd.getTime();
}

/**
 * @param {import('../model/models/Event.js').Event} master
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Record<string, unknown>[]}
 */
function expandGregorianMaster(master, rangeStart, rangeEnd) {
  const rruleResult = validateStoredUserRRule(master.rrule);
  const isWithinRange = eventOverlapsRange(master.startDate, master.endDate, rangeStart, rangeEnd);
  if (!rruleResult.ok || !master.rrule) {
    if (isWithinRange) {
      return [master];
    }
    return [];
  }

  const dtstart = new Date(master.startDate);
  const durMs = new Date(master.endDate).getTime() - dtstart.getTime();
  if (Number.isNaN(durMs) || durMs < 0) {
    return [];
  }

  if (RRule == null || typeof RRule.parseString !== "function") {
    if (isWithinRange) {
      return [master];
    }
    return [];
  }

  try {
    const parsed = RRule.parseString(
      `RRULE:${String(master.rrule).replace(/^RRULE:/i, "")}`,
    );
    const rule = new RRule({ ...parsed, dtstart });
    const dates = rule.between(rangeStart, rangeEnd, true);
    return dates.map((d) => {
      const st = new Date(d.getTime());
      const en = new Date(st.getTime() + durMs);
      return {
        ...master,
        startDate: st.toISOString(),
        endDate: en.toISOString(),
      };
    });
  } catch {
    if (isWithinRange) {
      return [master];
    }
    return [];
  }
}

/**
 * @param {import('../model/models/Event.js').Event} master
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Record<string, unknown>[]}
 */
function expandIslamicMaster(master, rangeStart, rangeEnd) {
  const validDefinition = getDefinitionById(master.islamicDefinitionId);
  if (!validDefinition) { // defintion checked from json events file 
    const isWithinRange = eventOverlapsRange(master.startDate, master.endDate, rangeStart, rangeEnd);
    if (isWithinRange) { // don't need to expand into the future then
      return [master];
    }
    return [];
  }

  const instances = generateIslamicEventsForDefinitionInDateRange(
    validDefinition,
    rangeStart,
    rangeEnd,
    master.eventTimezone,
  );

  return instances.map((inst) => ({
    ...master,
    name: master.name ?? inst.name,
    startDate: inst.startDate,
    endDate: inst.endDate,
    description: master.description ?? inst.description,
    rrule: inst.rrule ?? master.rrule,
    hijriMonth: inst.hijriMonth ?? master.hijriMonth,
    hijriDay: inst.hijriDay ?? master.hijriDay,
    durationDays: inst.durationDays ?? master.durationDays,
    hide: master.hide,
  }));
}

/**
 * @param {import('../model/models/Event.js').Event[]} stored, events array from database
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Record<string, unknown>[]}
 */
export function expandStoredEventsForRange(stored, rangeStart, rangeEnd) {
  const out = [];

  for (const row of stored) {
    const isAnEvent = row instanceof Event;
    if (!isAnEvent) continue;
    const master = row; // represent the original event object from database

    if (master.islamicDefinitionId) {
      out.push(...expandIslamicMaster(master, rangeStart, rangeEnd));
      continue;
    }

    if (master.rrule) {
      out.push(...expandGregorianMaster(master, rangeStart, rangeEnd));
      continue;
    }

    const base = master.toJSON();
    if (
      master.startDate &&
      master.endDate &&
      eventOverlapsRange(master.startDate, master.endDate, rangeStart, rangeEnd)
    ) {
      out.push(base);
    }
  }

  out.sort(
    (a, b) =>
      new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime(),
  );
  return out;
}

/**
 * Parse `YYYY-MM-DD` as local calendar date; fallback to Date.parse.
 * @param {string} s
 * @returns {Date}
 */
export function parseRangeDateParam(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    return new Date(Date.UTC(y, mo, d, 0, 0, 0, 0));
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

/**
 * End-of-day for an inclusive range upper bound.
 * @param {Date} d
 * @returns {Date}
 */
export function endOfLocalDay(d) {
  const x = new Date(d.getTime());
  x.setUTCHours(23, 59, 59, 999);
  return x;
}
