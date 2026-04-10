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
});
