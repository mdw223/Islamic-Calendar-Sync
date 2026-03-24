describe("EventExpansionService UTC range parsing", () => {
  test("parseRangeDateParam parses YYYY-MM-DD as UTC midnight", async () => {
    const { parseRangeDateParam } = await import("./EventExpansionService.js");
    const parsed = parseRangeDateParam("2026-03-23");
    expect(parsed.toISOString()).toBe("2026-03-23T00:00:00.000Z");
  });

  test("endOfLocalDay sets UTC day end for inclusive range", async () => {
    const { endOfLocalDay, parseRangeDateParam } = await import("./EventExpansionService.js");
    const parsed = parseRangeDateParam("2026-03-23");
    const end = endOfLocalDay(parsed);
    expect(end.toISOString()).toBe("2026-03-23T23:59:59.999Z");
  });
});
