import { jest } from "@jest/globals";

const findAllByUserId = jest.fn();
const buildIcsString = jest.fn();

jest.unstable_mockModule("../../model/db/doa/EventDOA.js", () => ({
  default: { findAllByUserId },
}));

jest.unstable_mockModule("../../services/IcsBuilder.js", () => ({
  buildIcsString,
}));

const { default: GetEventsIcs } = await import("./GetEventsIcs.js");

describe("GetEventsIcs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    const headers = {};
    return {
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockImplementation((key, value) => {
        headers[key] = value;
        return { headers };
      }),
      getHeaders: () => headers,
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  describe("filename generation", () => {
    beforeEach(() => {
      findAllByUserId.mockResolvedValue([]);
      buildIcsString.mockReturnValue("BEGIN:VCALENDAR\nEND:VCALENDAR");
    });

    test("single year query sets filename with single year", async () => {
      const req = { user: { userId: 1 }, query: { years: "2026" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const contentDisposition = setHeaderCalls.find(
        (call) => call[0] === "Content-Disposition"
      );
      expect(contentDisposition).toBeDefined();
      expect(contentDisposition[1]).toBe('attachment; filename="islamic-calendar-2026.ics"');
    });

    test("multiple years query sets filename with year range", async () => {
      const req = { user: { userId: 1 }, query: { years: "2026,2027,2028" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const contentDisposition = setHeaderCalls.find(
        (call) => call[0] === "Content-Disposition"
      );
      expect(contentDisposition).toBeDefined();
      expect(contentDisposition[1]).toBe('attachment; filename="islamic-calendar-2026-2028.ics"');
    });

    test("from/to query with same year sets filename with single year", async () => {
      const req = { user: { userId: 1 }, query: { from: "2026-01-01", to: "2026-12-31" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const contentDisposition = setHeaderCalls.find(
        (call) => call[0] === "Content-Disposition"
      );
      expect(contentDisposition).toBeDefined();
      expect(contentDisposition[1]).toBe('attachment; filename="islamic-calendar-2026.ics"');
    });

    test("from/to query with different years sets filename with year range", async () => {
      const req = { user: { userId: 1 }, query: { from: "2026-01-01", to: "2028-12-31" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const contentDisposition = setHeaderCalls.find(
        (call) => call[0] === "Content-Disposition"
      );
      expect(contentDisposition).toBeDefined();
      expect(contentDisposition[1]).toBe('attachment; filename="islamic-calendar-2026-2028.ics"');
    });

    test("sparse years are normalized to min-max range in filename", async () => {
      const req = { user: { userId: 1 }, query: { years: "2025,2027,2029" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const contentDisposition = setHeaderCalls.find(
        (call) => call[0] === "Content-Disposition"
      );
      expect(contentDisposition).toBeDefined();
      expect(contentDisposition[1]).toBe('attachment; filename="islamic-calendar-2025-2029.ics"');
    });

    test("unsorted years are sorted before building filename", async () => {
      const req = { user: { userId: 1 }, query: { years: "2028,2026,2027" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const contentDisposition = setHeaderCalls.find(
        (call) => call[0] === "Content-Disposition"
      );
      expect(contentDisposition).toBeDefined();
      expect(contentDisposition[1]).toBe('attachment; filename="islamic-calendar-2026-2028.ics"');
    });

    test("default range (no query params) uses calculated year range", async () => {
      const currentYear = new Date().getFullYear();
      const req = { user: { userId: 1 }, query: {} };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const contentDisposition = setHeaderCalls.find(
        (call) => call[0] === "Content-Disposition"
      );
      expect(contentDisposition).toBeDefined();
      // Default range is currentYear-1 to currentYear+2
      const expectedStart = currentYear - 1;
      const expectedEnd = currentYear + 2;
      expect(contentDisposition[1]).toBe(
        `attachment; filename="islamic-calendar-${expectedStart}-${expectedEnd}.ics"`
      );
    });
  });

  describe("error handling", () => {
    test("returns 400 for invalid years parameter", async () => {
      const req = { user: { userId: 1 }, query: { years: "abc" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Query parameter "years" must be a comma-separated list of years, e.g. years=2025,2027.',
      });
    });

    test("returns 400 for invalid includeAll parameter", async () => {
      const req = { user: { userId: 1 }, query: { years: "2026", includeAll: "invalid" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Query parameter "includeAll" must be true or false.',
      });
    });

    test("returns 400 when to date is before from date", async () => {
      const req = { user: { userId: 1 }, query: { from: "2026-12-31", to: "2026-01-01" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid range: "to" must be on or after "from".',
      });
    });
  });

  describe("content headers", () => {
    beforeEach(() => {
      findAllByUserId.mockResolvedValue([]);
      buildIcsString.mockReturnValue("BEGIN:VCALENDAR\nEND:VCALENDAR");
    });

    test("sets correct Content-Type header", async () => {
      const req = { user: { userId: 1 }, query: { years: "2026" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const contentType = setHeaderCalls.find((call) => call[0] === "Content-Type");
      expect(contentType).toBeDefined();
      expect(contentType[1]).toBe("text/calendar; charset=utf-8");
    });

    test("sets Cache-Control header to no-store", async () => {
      const req = { user: { userId: 1 }, query: { years: "2026" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      const setHeaderCalls = res.setHeader.mock.calls;
      const cacheControl = setHeaderCalls.find((call) => call[0] === "Cache-Control");
      expect(cacheControl).toBeDefined();
      expect(cacheControl[1]).toBe("no-store");
    });

    test("returns 200 status on success", async () => {
      const req = { user: { userId: 1 }, query: { years: "2026" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("sends ICS text content", async () => {
      const icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR";
      findAllByUserId.mockResolvedValue([]);
      buildIcsString.mockReturnValue(icsContent);

      const req = { user: { userId: 1 }, query: { years: "2026" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      expect(res.send).toHaveBeenCalledWith(icsContent);
    });
  });

  describe("event expansion", () => {
    test("includes addSubscriptionUrl option when building ICS", async () => {
      findAllByUserId.mockResolvedValue([]);
      buildIcsString.mockReturnValue("BEGIN:VCALENDAR\nEND:VCALENDAR");

      const req = { user: { userId: 1 }, query: { years: "2026" } };
      const res = makeRes();

      await GetEventsIcs(req, res);

      expect(buildIcsString).toHaveBeenCalledWith([], { addSubscriptionUrl: true });
    });
  });
});
