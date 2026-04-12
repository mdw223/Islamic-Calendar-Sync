describe("HijriUtils all-day normalization", () => {
  const definition = {
    id: "test-id",
    titleAr: "اختبار",
    titleEn: "Test",
    description: "test",
    eventTypeId: 1,
    isAllDay: true,
    hijriMonth: 9,
    hijriDay: 1,
    durationDays: 1,
    isHidden: false,
  };

  test("single-day events are anchored at UTC noon", async () => {
    const { generateIslamicEventsForYear } = await import("./HijriUtils.js");
    const rows = generateIslamicEventsForYear(2026, [definition], "UTC");
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      expect(row.startDate.endsWith("T12:00:00.000Z")).toBe(true);
      expect(row.endDate.endsWith("T12:00:00.000Z")).toBe(true);
      expect(new Date(row.endDate).getTime()).toBeGreaterThanOrEqual(
        new Date(row.startDate).getTime(),
      );
    }
  });

  test("date-range expansion stays one day for one-day all-day definitions", async () => {
    const { generateIslamicEventsForDefinitionInDateRange } = await import("./HijriUtils.js");
    const rangeStart = new Date(Date.UTC(2026, 0, 1, 0, 0, 0, 0));
    const rangeEnd = new Date(Date.UTC(2026, 11, 31, 23, 59, 59, 999));
    const rows = generateIslamicEventsForDefinitionInDateRange(
      definition,
      rangeStart,
      rangeEnd,
      "America/Los_Angeles",
    );
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const start = new Date(row.startDate).getTime();
      const end = new Date(row.endDate).getTime();
      expect(end - start).toBe(0);
    }
  });

  test("normalization is stable across positive and negative offsets", async () => {
    const { generateIslamicEventsForYear } = await import("./HijriUtils.js");
    const laRows = generateIslamicEventsForYear(2026, [definition], "America/Los_Angeles");
    const auRows = generateIslamicEventsForYear(2026, [definition], "Australia/Sydney");
    expect(laRows.length).toBeGreaterThan(0);
    expect(auRows.length).toBeGreaterThan(0);

    for (const row of [...laRows, ...auRows]) {
      expect(row.startDate.endsWith("T12:00:00.000Z")).toBe(true);
      expect(row.endDate.endsWith("T12:00:00.000Z")).toBe(true);
    }
  });

  test("buildIslamicRecurrenceFields handles monthly special case and generic monthly", async () => {
    const { buildIslamicRecurrenceFields } = await import("./HijriUtils.js");

    const special = buildIslamicRecurrenceFields({
      repeatsEachMonth: true,
      hijriDay: 13,
      hijriMonth: 7,
      durationDays: 3,
    });
    expect(special.rrule).toBe("FREQ=MONTHLY;BYMONTHDAY=13,14,15");

    const generic = buildIslamicRecurrenceFields({
      repeatsEachMonth: true,
      hijriDay: 5,
      hijriMonth: 8,
      durationDays: 2,
    });
    expect(generic.rrule).toBe("FREQ=MONTHLY;BYMONTHDAY=5,6");
  });

  test("buildIslamicRecurrenceFields handles annual missing/interval cases", async () => {
    const { buildIslamicRecurrenceFields } = await import("./HijriUtils.js");

    const missing = buildIslamicRecurrenceFields({
      repeatsEachMonth: false,
      hijriMonth: null,
      hijriDay: 1,
      durationDays: 1,
    });
    expect(missing.rrule).toBeNull();

    const interval = buildIslamicRecurrenceFields({
      repeatsEachMonth: false,
      hijriMonth: 9,
      hijriDay: 1,
      durationDays: 2,
    });
    expect(interval.rrule).toBe("FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=1;INTERVAL=2");
  });

  test("getHijriNumericParts returns numeric day/month/year", async () => {
    const { getHijriNumericParts } = await import("./HijriUtils.js");
    const parts = getHijriNumericParts(new Date("2026-03-23T12:00:00.000Z"));

    expect(Number.isInteger(parts.day)).toBe(true);
    expect(Number.isInteger(parts.month)).toBe(true);
    expect(Number.isInteger(parts.year)).toBe(true);
    expect(parts.day).toBeGreaterThan(0);
    expect(parts.month).toBeGreaterThan(0);
    expect(parts.year).toBeGreaterThan(0);
  });

  test("buildIslamicMasterRowsForYears handles empty years and hidden definitions", async () => {
    const { buildIslamicMasterRowsForYears } = await import("./HijriUtils.js");

    expect(buildIslamicMasterRowsForYears([], [definition], "UTC")).toEqual([]);

    const visible = {
      ...definition,
      repeatsEachMonth: false,
      isHidden: false,
    };
    const hidden = {
      ...definition,
      id: "hidden-id",
      isHidden: true,
    };

    const rows = buildIslamicMasterRowsForYears([2026, 2027], [visible, hidden], "UTC");
    expect(rows.length).toBe(1);
    expect(rows[0].islamicDefinitionId).toBe("test-id");
  });

  test("generateIslamicEventsForYear supports repeatsEachMonth definitions", async () => {
    const { generateIslamicEventsForYear } = await import("./HijriUtils.js");

    const monthly = {
      ...definition,
      id: "monthly-id",
      repeatsEachMonth: true,
      durationDays: 1,
      hijriDay: 1,
      hijriMonth: null,
    };

    const rows = generateIslamicEventsForYear(2026, [monthly], "UTC");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.islamicDefinitionId === "monthly-id")).toBe(true);
  });
});
