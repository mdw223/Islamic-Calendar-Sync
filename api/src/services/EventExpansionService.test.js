import { Event } from "../model/models/Event.js";

const {
  parseRangeDateParam,
  endOfLocalDay,
  validateStoredUserRRule,
  expandStoredEventsForRange,
} = await import("./EventExpansionService.js");

function makeEvent(overrides = {}) {
  const event = new Event();
  Object.assign(event, {
    eventId: 1,
    name: "Event",
    location: null,
    startDate: "2026-01-01T10:00:00.000Z",
    endDate: "2026-01-01T11:00:00.000Z",
    isAllDay: false,
    description: "desc",
    hide: false,
    isTask: false,
    islamicDefinitionId: null,
    hijriMonth: null,
    hijriDay: null,
    durationDays: null,
    rrule: null,
    eventTimezone: "UTC",
    userId: 11,
  }, overrides);
  return event;
}

describe("EventExpansionService range helpers", () => {
  test("parseRangeDateParam parses YYYY-MM-DD as UTC midnight", () => {
    const parsed = parseRangeDateParam("2026-03-23");
    expect(parsed.toISOString()).toBe("2026-03-23T00:00:00.000Z");
  });

  test("parseRangeDateParam falls back to now when input is invalid", () => {
    const parsed = parseRangeDateParam("invalid-date");
    expect(Number.isNaN(parsed.getTime())).toBe(false);
  });

  test("endOfLocalDay sets UTC day end for inclusive range", () => {
    const parsed = parseRangeDateParam("2026-03-23");
    const end = endOfLocalDay(parsed);
    expect(end.toISOString()).toBe("2026-03-23T23:59:59.999Z");
  });
});

describe("EventExpansionService RRule validation", () => {
  test("accepts null rrule as empty", () => {
    expect(validateStoredUserRRule(null)).toEqual({ ok: true, value: "" });
  });

  test("rejects non-string and overlong rrule", () => {
    expect(validateStoredUserRRule(123)).toEqual({
      ok: false,
      message: "RRule must be a string of 512 characters or fewer.",
    });
    expect(validateStoredUserRRule("F".repeat(513))).toEqual({
      ok: false,
      message: "RRule must be a string of 512 characters or fewer.",
    });
  });

  test("rejects invalid rrule characters", () => {
    expect(validateStoredUserRRule("FREQ=DAILY;BYDAY=<MO>")).toEqual({
      ok: false,
      message: "RRule contains invalid characters.",
    });
  });

  test("accepts valid RRULE and strips RRULE prefix", () => {
    expect(validateStoredUserRRule("RRULE:FREQ=DAILY;COUNT=2")).toEqual({
      ok: true,
      value: "FREQ=DAILY;COUNT=2",
    });
  });
});

describe("EventExpansionService expansion", () => {
  const rangeStart = new Date("2026-01-01T00:00:00.000Z");
  const rangeEnd = new Date("2026-12-31T23:59:59.999Z");

  test("skips non-Event rows and expands/sorts matching single events", () => {
    const late = makeEvent({ eventId: 2, startDate: "2026-06-10T09:00:00.000Z", endDate: "2026-06-10T10:00:00.000Z" });
    const early = makeEvent({ eventId: 3, startDate: "2026-01-03T09:00:00.000Z", endDate: "2026-01-03T10:00:00.000Z" });
    const outOfRange = makeEvent({ eventId: 4, startDate: "2025-01-01T09:00:00.000Z", endDate: "2025-01-01T10:00:00.000Z" });

    const expanded = expandStoredEventsForRange([{}, late, outOfRange, early], rangeStart, rangeEnd);

    expect(expanded.length).toBe(2);
    expect(expanded[0].eventId).toBe(3);
    expect(expanded[1].eventId).toBe(2);
  });

  test("expands gregorian recurring events via RRule", () => {
    const recurring = makeEvent({
      eventId: 5,
      startDate: "2026-01-05T12:00:00.000Z",
      endDate: "2026-01-05T13:00:00.000Z",
      rrule: "FREQ=DAILY;COUNT=3",
    });

    const expanded = expandStoredEventsForRange([recurring], rangeStart, rangeEnd);

    expect(expanded.length).toBe(3);
    expect(expanded[0].startDate).toBe("2026-01-05T12:00:00.000Z");
    expect(expanded[2].startDate).toBe("2026-01-07T12:00:00.000Z");
  });

  test("invalid recurring rules fall back to single overlap behavior", () => {
    const invalidRecurring = makeEvent({
      eventId: 6,
      startDate: "2026-01-05T12:00:00.000Z",
      endDate: "2026-01-05T13:00:00.000Z",
      rrule: "FREQ=INVALID",
    });

    const expanded = expandStoredEventsForRange([invalidRecurring], rangeStart, rangeEnd);

    expect(expanded.length).toBe(1);
    expect(expanded[0]).toBe(invalidRecurring);
  });

  test("islamic events with unknown definition fall back to overlap", () => {
    const unknownDefinition = makeEvent({
      eventId: 7,
      islamicDefinitionId: "missing_definition_id",
      startDate: "2026-01-05T12:00:00.000Z",
      endDate: "2026-01-05T13:00:00.000Z",
    });

    const expanded = expandStoredEventsForRange([unknownDefinition], rangeStart, rangeEnd);

    expect(expanded.length).toBe(1);
    expect(expanded[0]).toBe(unknownDefinition);
  });

  test("islamic events with unknown definition and no overlap return empty", () => {
    const unknownDefinition = makeEvent({
      eventId: 9,
      islamicDefinitionId: "missing_definition_id",
      startDate: "2024-01-05T12:00:00.000Z",
      endDate: "2024-01-05T13:00:00.000Z",
    });

    const expanded = expandStoredEventsForRange([unknownDefinition], rangeStart, rangeEnd);

    expect(expanded).toEqual([]);
  });

  test("islamic events with known definitions expand from generated instances", () => {
    const knownDefinition = makeEvent({
      eventId: 8,
      islamicDefinitionId: "ashura",
      startDate: "2026-01-01T12:00:00.000Z",
      endDate: "2026-01-01T12:00:00.000Z",
      name: null,
      description: null,
      rrule: null,
      hijriMonth: null,
      hijriDay: null,
      durationDays: null,
    });

    const expanded = expandStoredEventsForRange([knownDefinition], rangeStart, rangeEnd);

    expect(expanded.length).toBeGreaterThan(0);
    expect(expanded[0].islamicDefinitionId).toBe("ashura");
    expect(expanded[0].name).toBeTruthy();
    expect(expanded[0].startDate).toBeTruthy();
  });
});
