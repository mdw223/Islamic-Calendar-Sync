import { jest } from "@jest/globals";

const findAllByUserId = jest.fn();

jest.unstable_mockModule("../../model/db/doa/UserLocationDOA.js", () => ({
  default: { findAllByUserId },
}));

const { default: GetUserLocations } = await import("./GetUserLocations.js");

describe("GetUserLocations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("returns user locations", async () => {
    findAllByUserId.mockResolvedValue([{ id: 1 }]);
    const req = { user: { userId: 5 } };
    const res = makeRes();

    await GetUserLocations(req, res);

    expect(findAllByUserId).toHaveBeenCalledWith(5);
    expect(res.json).toHaveBeenCalledWith({ success: true, userLocations: [{ id: 1 }] });
  });

  test("returns 500 on failure", async () => {
    findAllByUserId.mockRejectedValue(new Error("boom"));
    const req = { user: { userId: 5 } };
    const res = makeRes();

    await GetUserLocations(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to load user locations." });
  });
});
