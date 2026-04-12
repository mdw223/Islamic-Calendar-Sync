import { jest } from "@jest/globals";

const deleteLocation = jest.fn();

jest.unstable_mockModule("../../model/db/doa/UserLocationDOA.js", () => ({
  default: { delete: deleteLocation },
}));

const { default: DeleteUserLocation } = await import("./DeleteUserLocation.js");

describe("DeleteUserLocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("returns 400 for invalid id", async () => {
    const req = { params: { userLocationId: "x" }, user: { userId: 3 } };
    const res = makeRes();

    await DeleteUserLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 404 when not deleted", async () => {
    deleteLocation.mockResolvedValue(false);
    const req = { params: { userLocationId: "8" }, user: { userId: 3 } };
    const res = makeRes();

    await DeleteUserLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns success when deleted", async () => {
    deleteLocation.mockResolvedValue(true);
    const req = { params: { userLocationId: "8" }, user: { userId: 3 } };
    const res = makeRes();

    await DeleteUserLocation(req, res);

    expect(deleteLocation).toHaveBeenCalledWith(3, 8);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });
});
