import { EventTypeId } from "../constants";

// ── Allowed eventTypeId values ──────────────────────────────────────────────
const VALID_EVENT_TYPE_IDS = new Set(Object.values(EventTypeId));

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true when `v` is a non-empty string (after trimming). */
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

/** Attempts to parse a value as a Date; returns null on failure. */
function toDate(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

// ── Default shape ───────────────────────────────────────────────────────────

export const defaultEvent = Object.freeze({
  eventId: null,
  name: null,
  startDate: null,
  endDate: null,
  isAllDay: true,
  description: null,
  hide: false,
  eventTypeId: EventTypeId.CUSTOM,
  isCustom: false,
  isTask: false,
  islamicDefinitionId: null,
  hijriMonth: null,
  hijriDay: null,
  durationDays: null,
  rrule: null,
  isSystemEvent: false,
  parentEventId: null,
});

// ── Normalise a raw API row (lowercase keys) ───────────────────────────────

export function fromApiRow(row) {
  if (!row) return null;
  return {
    eventId: row.eventid ?? null,
    name: row.name ?? null,
    startDate: row.startdate ?? null,
    endDate: row.enddate ?? null,
    isAllDay: row.isallday ?? true,
    description: row.description ?? null,
    hide: row.hide ?? false,
    eventTypeId: row.eventtypeid ?? EventTypeId.CUSTOM,
    isCustom: row.iscustom ?? false,
    isTask: row.istask ?? false,
    islamicDefinitionId: row.islamicdefinitionid ?? null,
    hijriMonth: row.hijrimonth ?? null,
    hijriDay: row.hijriday ?? null,
    durationDays: row.durationdays ?? null,
    rrule: row.rrule ?? null,
    isSystemEvent: row.issystemevent ?? false,
    parentEventId: row.parenteventid ?? null,
  };
}

// ── Event class ─────────────────────────────────────────────────────────────

export class Event {
  /**
   * @param {Record<string, any>} data – camelCase or raw API row data.
   * @throws {Error} if required fields are missing / invalid after defaults.
   */
  constructor(data = {}) {
    // Normalise: if the payload looks like a raw API row, map first.
    const normalized =
      data.eventid != null ? fromApiRow(data) : { ...defaultEvent, ...data };

    // ── Assign fields ────────────────────────────────────────────────────
    this.eventId = normalized.eventId ?? null;
    this.name = normalized.name ?? null;
    this.startDate = normalized.startDate ?? null;
    this.endDate = normalized.endDate ?? null;
    this.isAllDay = normalized.isAllDay ?? true;
    this.description = normalized.description ?? null;
    this.hide = normalized.hide ?? false;
    this.eventTypeId = normalized.eventTypeId ?? EventTypeId.CUSTOM;
    this.isCustom = normalized.isCustom ?? false;
    this.isTask = normalized.isTask ?? false;
    this.hijriMonth = normalized.hijriMonth ?? null;
    this.hijriDay = normalized.hijriDay ?? null;
    this.durationDays = normalized.durationDays ?? null;
    this.rrule = normalized.rrule ?? null;
    this.isSystemEvent = normalized.isSystemEvent ?? false;
    this.parentEventId = normalized.parentEventId ?? null;
    this.islamicDefinitionId = normalized.islamicDefinitionId ?? null;
  }

  // ── Validation ─────────────────────────────────────────────────────────

  /**
   * Run all validation rules and return an array of human-readable error
   * strings.  An empty array means the event is valid.
   *
   * @returns {string[]}
   */
  validate() {
    const errors = [];

    // name — must be a non-empty string.
    if (!isNonEmptyString(this.name)) {
      errors.push("name is required and must be a non-empty string.");
    }

    // startDate — must parse to a valid Date.
    const start = toDate(this.startDate);
    if (!start) {
      errors.push("startDate is required and must be a valid date/ISO string.");
    }

    // endDate — must parse and be >= startDate.
    const end = toDate(this.endDate);
    if (!end) {
      errors.push("endDate is required and must be a valid date/ISO string.");
    } else if (start && end < start) {
      errors.push("endDate must not be earlier than startDate.");
    }

    // eventTypeId — must be one of the known EventTypeId values.
    if (!VALID_EVENT_TYPE_IDS.has(this.eventTypeId)) {
      errors.push(
        `eventTypeId must be one of [${[...VALID_EVENT_TYPE_IDS].join(", ")}], got ${this.eventTypeId}.`,
      );
    }

    // Boolean coercion sanity — catch accidental string / number values.
    for (const flag of ["isAllDay", "hide", "isCustom", "isTask"]) {
      if (typeof this[flag] !== "boolean") {
        errors.push(`${flag} must be a boolean, got ${typeof this[flag]}.`);
      }
    }

    return errors;
  }

  /**
   * Shorthand — returns true when `validate()` produces no errors.
   * @returns {boolean}
   */
  isValid() {
    return this.validate().length === 0;
  }

  /**
   * Throws an Error whose message lists every validation failure.
   * Useful as a hard guardrail when constructing events programmatically.
   *
   * @throws {Error}
   */
  assertValid() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`Invalid Event:\n  • ${errors.join("\n  • ")}`);
    }
  }

  // ── Serialisation ──────────────────────────────────────────────────────

  /** Plain-object representation (safe for JSON / localStorage / API body). */
  toJSON() {
    return {
      eventId: this.eventId,
      name: this.name,
      startDate: this.startDate,
      endDate: this.endDate,
      isAllDay: this.isAllDay,
      description: this.description,
      hide: this.hide,
      eventTypeId: this.eventTypeId,
      isCustom: this.isCustom,
      isTask: this.isTask,
      islamicDefinitionId: this.islamicDefinitionId,
      hijriMonth: this.hijriMonth,
      hijriDay: this.hijriDay,
      durationDays: this.durationDays,
      rrule: this.rrule,
      isSystemEvent: this.isSystemEvent,
      parentEventId: this.parentEventId,
    };
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create and validate an Event in one step.
 * Throws immediately if any field is invalid — guaranteeing every event that
 * leaves this factory is well-formed.
 *
 * @param {Record<string, any>} data
 * @returns {Event}
 */
export const createEvent = (data = {}) => {
  const event = new Event(data);
  event.assertValid();
  return event;
};
