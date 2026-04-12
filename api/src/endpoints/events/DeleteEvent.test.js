import { jest } from "@jest/globals";

const deleteEvent = jest.fn();

jest.unstable_mockModule("../../model/db/doa/EventDOA.js", () => ({
  default: { deleteEvent },
}));

const { default: DeleteEvent } = await import("./DeleteEvent.js");

describe("DeleteEvent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  }

  test("returns 400 for invalid event id", async () => {
    const req = { params: { eventId: "bad" }, user: { userId: 4 } };
    const res = makeRes();

    await DeleteEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 404 when nothing deleted", async () => {
    deleteEvent.mockResolvedValue(false);
    const req = { params: { eventId: "15" }, user: { userId: 4 } };
    const res = makeRes();

    await DeleteEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 204 when deleted", async () => {
    deleteEvent.mockResolvedValue(true);
    const req = { params: { eventId: "15" }, user: { userId: 4 } };
    const res = makeRes();

    await DeleteEvent(req, res);

    expect(deleteEvent).toHaveBeenCalledWith(15, 4);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
