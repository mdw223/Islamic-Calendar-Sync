import { jest } from "@jest/globals";

const createEvent = jest.fn();
const validateStoredUserRRule = jest.fn();
const fromRequest = jest.fn();

jest.unstable_mockModule("../../model/db/doa/EventDOA.js", () => ({
  default: { createEvent },
}));

jest.unstable_mockModule("../../services/EventExpansionService.js", () => ({
  validateStoredUserRRule,
}));

jest.unstable_mockModule("../../model/models/Event.js", () => ({
  Event: { fromRequest },
}));

const { default: CreateEvent } = await import("./CreateEvent.js");

describe("CreateEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test("returns 400 when required fields are missing", async () => {
    fromRequest.mockReturnValue({ name: null, startDate: null, endDate: null });
    const req = { body: {}, user: { userId: 8 } };
    const res = makeRes();

    await CreateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 400 on invalid rrule", async () => {
    fromRequest.mockReturnValue({
      name: "Test",
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      rrule: "bad",
    });
    validateStoredUserRRule.mockReturnValue({ ok: false, message: "Invalid RRule string." });

    const req = { body: {}, user: { userId: 8 } };
    const res = makeRes();
    await CreateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid RRule string." });
  });

  test("creates event with normalized rrule and returns 201", async () => {
    fromRequest.mockReturnValue({
      name: "Test",
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      rrule: "RRULE:FREQ=DAILY;COUNT=2",
      description: "d",
      location: "l",
    });
    validateStoredUserRRule.mockReturnValue({ ok: true, value: "FREQ=DAILY;COUNT=2" });
    createEvent.mockResolvedValue({ eventId: 11 });

    const req = { body: {}, user: { userId: 8 } };
    const res = makeRes();
    await CreateEvent(req, res);

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 8, rrule: "FREQ=DAILY;COUNT=2" }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, event: { eventId: 11 } });
  });

  test("returns 400 when color format is invalid", async () => {
    fromRequest.mockReturnValue({
      name: "Test",
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      color: "red",
    });
    const req = { body: {}, user: { userId: 8 } };
    const res = makeRes();

    await CreateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("defaults missing event type to custom and allows color", async () => {
    fromRequest.mockReturnValue({
      name: "Test",
      startDate: "2026-01-01",
      endDate: "2026-01-02",
      color: "#112233",
    });
    createEvent.mockResolvedValue({ eventId: 12 });
    const req = { body: {}, user: { userId: 8 } };
    const res = makeRes();

    await CreateEvent(req, res);

    expect(createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 8,
        color: "#112233",
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
