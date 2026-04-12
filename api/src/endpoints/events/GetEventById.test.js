import { jest } from "@jest/globals";

const findById = jest.fn();

jest.unstable_mockModule("../../model/db/doa/EventDOA.js", () => ({
  default: { findById },
}));

const { default: GetEventById } = await import("./GetEventById.js");

describe("GetEventById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  test("returns 400 for non-numeric id", async () => {
    const req = { params: { eventId: "abc" }, user: { userId: 3 } };
    const res = makeRes();

    await GetEventById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid event ID" });
  });

  test("returns 404 when event is missing", async () => {
    findById.mockResolvedValue(null);
    const req = { params: { eventId: "10" }, user: { userId: 3 } };
    const res = makeRes();

    await GetEventById(req, res);

    expect(findById).toHaveBeenCalledWith(10, 3);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Event not found" });
  });

  test("returns event payload when found", async () => {
    findById.mockResolvedValue({ eventId: 10 });
    const req = { params: { eventId: "10" }, user: { userId: 3 } };
    const res = makeRes();

    await GetEventById(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, event: { eventId: 10 } });
  });
});
