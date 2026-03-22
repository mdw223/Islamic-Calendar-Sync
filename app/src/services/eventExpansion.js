/**
 * Expands stored event rows into calendar instances (mirrors api EventExpansionService).
 */

import { RRule } from "rrule";
import {
  generateIslamicEventsForDefinitionInDateRange,
  getBaseDefinitions,
} from "./IslamicEventService.js";

let definitionCache = null;

function getDefinitionById(id) {
  if (!definitionCache) {
    definitionCache = new Map(getBaseDefinitions().map((d) => [d.id, d]));
  }
  return definitionCache.get(id) ?? null;
}

export function parseRangeDateParam(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s).trim());
  if (m) {
    const y = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const d = parseInt(m[3], 10);
    return new Date(y, mo, d, 0, 0, 0, 0);
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export function endOfLocalDay(d) {
  const x = new Date(d.getTime());
  x.setHours(23, 59, 59, 999);
  return x;
}

function eventOverlapsRange(startIso, endIso, rangeStart, rangeEnd) {
  const es = new Date(startIso).getTime();
  const ee = new Date(endIso).getTime();
  return ee >= rangeStart.getTime() && es <= rangeEnd.getTime();
}

function expandGregorianMaster(master, rangeStart, rangeEnd) {
  const base = { ...master };
  if (!master.rrule) {
    if (
      master.startDate &&
      master.endDate &&
      eventOverlapsRange(master.startDate, master.endDate, rangeStart, rangeEnd)
    ) {
      return [base];
    }
    return [];
  }

  const dtstart = new Date(master.startDate);
  const durMs = new Date(master.endDate).getTime() - dtstart.getTime();
  if (Number.isNaN(durMs) || durMs < 0) {
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
        ...base,
        startDate: st.toISOString(),
        endDate: en.toISOString(),
      };
    });
  } catch {
    if (
      master.startDate &&
      master.endDate &&
      eventOverlapsRange(master.startDate, master.endDate, rangeStart, rangeEnd)
    ) {
      return [base];
    }
    return [];
  }
}

function expandIslamicMaster(master, rangeStart, rangeEnd) {
  const base = { ...master };
  const jsonDef = getDefinitionById(master.islamicDefinitionId);
  if (!jsonDef) {
    if (
      master.startDate &&
      master.endDate &&
      eventOverlapsRange(master.startDate, master.endDate, rangeStart, rangeEnd)
    ) {
      return [base];
    }
    return [];
  }

  const def = {
    ...jsonDef,
    description: master.description ?? jsonDef.description ?? null,
  };

  const instances = generateIslamicEventsForDefinitionInDateRange(
    def,
    rangeStart,
    rangeEnd,
    master.eventTimezone,
  );

  return instances.map((inst) => ({
    ...base,
    name: inst.name,
    startDate: inst.startDate,
    endDate: inst.endDate,
    description: master.description ?? inst.description,
    rrule: inst.rrule ?? base.rrule,
    hijriMonth: inst.hijriMonth ?? base.hijriMonth,
    hijriDay: inst.hijriDay ?? base.hijriDay,
    durationDays: inst.durationDays ?? base.durationDays,
    hide: master.hide,
  }));
}

/**
 * @param {Object[]} stored — plain event objects (eventId from API or Dexie)
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 */
export function expandStoredEventsForRange(stored, rangeStart, rangeEnd) {
  const out = [];

  for (const master of stored) {
    if (!master) continue;

    if (master.islamicDefinitionId) {
      out.push(...expandIslamicMaster(master, rangeStart, rangeEnd));
      continue;
    }

    if (master.rrule) {
      out.push(...expandGregorianMaster(master, rangeStart, rangeEnd));
      continue;
    }

    if (
      master.startDate &&
      master.endDate &&
      eventOverlapsRange(master.startDate, master.endDate, rangeStart, rangeEnd)
    ) {
      out.push({ ...master });
    }
  }

  out.sort(
    (a, b) =>
      new Date(a.startDate ?? 0).getTime() - new Date(b.startDate ?? 0).getTime(),
  );
  return out;
}
