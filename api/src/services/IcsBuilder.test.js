import { buildIcsString } from "./IcsBuilder.js";

describe("IcsBuilder", () => {
  test("builds a VCALENDAR with a UTC timed event", () => {
    const ics = buildIcsString([
      {
        name: "Morning Event",
        description: "Line1\nLine2",
        location: "Office",
        startDate: "2026-03-23T09:30:00.000Z",
        endDate: "2026-03-23T10:00:00.000Z",
        isAllDay: false,
      },
    ]);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("SUMMARY;LANGUAGE=en-us:Morning Event");
    expect(ics).toContain("DTSTART;TZID=UTC:20260323T093000");
    expect(ics).toContain("DTEND;TZID=UTC:20260323T100000");
    expect(ics).toContain("DESCRIPTION:Line1\\nLine2");
  });

  test("all-day events use VALUE=DATE with exclusive DTEND", () => {
    const ics = buildIcsString([
      {
        name: "All Day",
        description: "Holiday",
        location: "",
        startDate: "2026-07-10T00:00:00.000Z",
        endDate: "2026-07-10T00:00:00.000Z",
        isAllDay: true,
      },
    ]);

    expect(ics).toContain("DTSTART;VALUE=DATE:20260710");
    expect(ics).toContain("DTEND;VALUE=DATE:20260710");
  });

  test("skips invalid rows and still returns a valid calendar", () => {
    const ics = buildIcsString([
      {
        name: "Bad",
        description: "bad",
        location: "",
        startDate: "not-a-date",
        endDate: "2026-07-10T00:00:00.000Z",
      },
    ]);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).not.toContain("BEGIN:VEVENT");
  });

  test("falls back to VALUE=DATE-TIME when no timezone is available", () => {
    const ics = buildIcsString(
      [
        {
          name: "No TZ",
          description: "desc",
          location: "",
          startDate: "2026-03-23T09:30:00.000Z",
          endDate: "2026-03-23T10:00:00.000Z",
          isAllDay: false,
          eventTimezone: null,
        },
      ],
      { defaultTimezone: "" },
    );

    expect(ics).toContain("DTSTART;VALUE=DATE-TIME:");
    expect(ics).toContain("DTEND;VALUE=DATE-TIME:");
    expect(ics).not.toContain("DTSTART;TZID=");
  });
});
