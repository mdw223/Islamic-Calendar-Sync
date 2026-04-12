import { jest } from "@jest/globals";

const findAllByUserId = jest.fn();
const expandStoredEventsForRange = jest.fn();
const parseRangeDateParam = jest.fn();
const endOfLocalDay = jest.fn();

jest.unstable_mockModule("../../model/db/doa/EventDOA.js", () => ({
  default: { findAllByUserId },
}));

jest.unstable_mockModule("../../services/EventExpansionService.js", () => ({
  expandStoredEventsForRange,
  parseRangeDateParam,
  endOfLocalDay,
}));

const { default: GetEvents } = await import("./GetEvents.js");

describe("GetEvents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test("returns expanded events for explicit from/to range", async () => {
    const fromDate = new Date("2026-01-01T00:00:00.000Z");
    const toDate = new Date("2026-01-31T23:59:59.999Z");
    parseRangeDateParam
      .mockReturnValueOnce(fromDate)
      .mockReturnValueOnce(new Date("2026-01-31T00:00:00.000Z"));
    endOfLocalDay.mockReturnValue(toDate);

    findAllByUserId.mockResolvedValue([{ id: 1 }]);
    expandStoredEventsForRange.mockReturnValue([{ id: "expanded" }]);

    const req = { user: { userId: 7 }, query: { from: "2026-01-01", to: "2026-01-31" } };
    const res = makeRes();

    await GetEvents(req, res);

    expect(findAllByUserId).toHaveBeenCalledWith(7);
    expect(expandStoredEventsForRange).toHaveBeenCalledWith([{ id: 1 }], fromDate, toDate);
    expect(res.json).toHaveBeenCalledWith({ success: true, events: [{ id: "expanded" }] });
  });

  test("returns 400 for invalid range where to < from", async () => {
    const fromDate = new Date("2026-02-10T00:00:00.000Z");
    const toDate = new Date("2026-02-01T23:59:59.999Z");
    parseRangeDateParam
      .mockReturnValueOnce(fromDate)
      .mockReturnValueOnce(new Date("2026-02-01T00:00:00.000Z"));
    endOfLocalDay.mockReturnValue(toDate);
    findAllByUserId.mockResolvedValue([]);

    const req = { user: { userId: 7 }, query: { from: "2026-02-10", to: "2026-02-01" } };
    const res = makeRes();

    await GetEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid range: "to" must be on or after "from".',
    });
  });

  test("returns 500 on unexpected errors", async () => {
    findAllByUserId.mockRejectedValue(new Error("db down"));
    const req = { user: { userId: 7 }, query: {} };
    const res = makeRes();

    await GetEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to get events" });
  });
});
