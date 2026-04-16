import { jest } from "@jest/globals";

const findById = jest.fn();
const updateEvent = jest.fn();
const sanitizeDescription = jest.fn();
const validateStoredUserRRule = jest.fn();

jest.unstable_mockModule("../../model/db/doa/EventDOA.js", () => ({
  default: { findById, updateEvent },
}));

jest.unstable_mockModule("../../util/SanitizeHtml.js", () => ({
  sanitizeDescription,
}));

jest.unstable_mockModule("../../services/EventExpansionService.js", () => ({
  validateStoredUserRRule,
}));

const { default: UpdateEvent } = await import("./UpdateEvent.js");

describe("UpdateEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test("returns 400 for invalid event id", async () => {
    const req = { params: { eventId: "abc" }, body: {}, user: { userId: 4 } };
    const res = makeRes();

    await UpdateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 400 for invalid rrule", async () => {
    validateStoredUserRRule.mockReturnValue({ ok: false, message: "Invalid RRule string." });
    const req = { params: { eventId: "5" }, body: { rrule: "bad" }, user: { userId: 4 } };
    const res = makeRes();

    await UpdateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid RRule string." });
  });

  test("returns 404 when event is not found", async () => {
    findById.mockResolvedValue(null);
    sanitizeDescription.mockReturnValue("clean");

    const req = { params: { eventId: "5" }, body: { description: "<b>x</b>" }, user: { userId: 4 } };
    const res = makeRes();

    await UpdateEvent(req, res);

    expect(findById).toHaveBeenCalledWith(5, 4);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("updates event successfully", async () => {
    sanitizeDescription.mockReturnValue("clean");
    validateStoredUserRRule.mockReturnValue({ ok: true, value: "FREQ=DAILY" });
    findById.mockResolvedValue({ eventId: 5 });
    updateEvent.mockResolvedValue({ eventId: 5, description: "clean" });

    const req = {
      params: { eventId: "5" },
      body: { description: "<b>x</b>", rrule: "RRULE:FREQ=DAILY" },
      user: { userId: 4 },
    };
    const res = makeRes();

    await UpdateEvent(req, res);

    expect(updateEvent).toHaveBeenCalledWith(5, 4, expect.objectContaining({ description: "clean", rrule: "FREQ=DAILY" }));
    expect(res.json).toHaveBeenCalledWith({ success: true, event: { eventId: 5, description: "clean" } });
  });

  test("returns 400 for invalid color", async () => {
    findById.mockResolvedValue({ eventId: 5, islamicDefinitionId: null });
    const req = { params: { eventId: "5" }, body: { color: "blue" }, user: { userId: 4 } };
    const res = makeRes();

    await UpdateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateEvent).not.toHaveBeenCalled();
  });

  test("returns 400 when definition-linked event tries per-event color", async () => {
    findById.mockResolvedValue({ eventId: 5, islamicDefinitionId: "ashura" });
    const req = {
      params: { eventId: "5" },
      body: { color: "#112233" },
      user: { userId: 4 },
    };
    const res = makeRes();

    await UpdateEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateEvent).not.toHaveBeenCalled();
  });

  test("stores attributed definition on a custom event", async () => {
    findById.mockResolvedValue({ eventId: 5, islamicDefinitionId: null });
    updateEvent.mockResolvedValue({ eventId: 5, attributedDefinitionId: "ashura" });

    const req = {
      params: { eventId: "5" },
      body: { attributedDefinitionId: "ashura", color: "#112233" },
      user: { userId: 4 },
    };
    const res = makeRes();

    await UpdateEvent(req, res);

    expect(updateEvent).toHaveBeenCalledWith(
      5,
      4,
      expect.objectContaining({
        attributedDefinitionId: "ashura",
        islamicDefinitionId: null,
        color: "#112233",
      }),
    );
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      event: { eventId: 5, attributedDefinitionId: "ashura" },
    });
  });
});
