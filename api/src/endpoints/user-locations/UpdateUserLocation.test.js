import { jest } from "@jest/globals";

const clearDefault = jest.fn();
const update = jest.fn();

jest.unstable_mockModule("../../model/db/doa/UserLocationDOA.js", () => ({
  default: { clearDefault, update },
}));

const { default: UpdateUserLocation } = await import("./UpdateUserLocation.js");

describe("UpdateUserLocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("returns 400 for invalid id", async () => {
    const req = { params: { userLocationId: "abc" }, body: {}, user: { userId: 3 } };
    const res = makeRes();

    await UpdateUserLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("clears default before updating when requested", async () => {
    update.mockResolvedValue({ userLocationId: 8 });
    const req = { params: { userLocationId: "8" }, body: { isDefault: true }, user: { userId: 3 } };
    const res = makeRes();

    await UpdateUserLocation(req, res);

    expect(clearDefault).toHaveBeenCalledWith(3);
    expect(update).toHaveBeenCalledWith(3, 8, { isDefault: true });
    expect(res.json).toHaveBeenCalledWith({ success: true, userLocation: { userLocationId: 8 } });
  });

  test("returns 404 when not found", async () => {
    update.mockResolvedValue(null);
    const req = { params: { userLocationId: "8" }, body: {}, user: { userId: 3 } };
    const res = makeRes();

    await UpdateUserLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
