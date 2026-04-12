import { jest } from "@jest/globals";

const countByUserId = jest.fn();
const clearDefault = jest.fn();
const create = jest.fn();

jest.unstable_mockModule("../../model/db/doa/UserLocationDOA.js", () => ({
  default: { countByUserId, clearDefault, create },
}));

const { default: CreateUserLocation } = await import("./CreateUserLocation.js");

describe("CreateUserLocation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("returns 400 when name or timezone is missing", async () => {
    const req = { body: { name: "Home" }, user: { userId: 2 } };
    const res = makeRes();

    await CreateUserLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 400 when user already has 3 locations", async () => {
    countByUserId.mockResolvedValue(3);
    const req = { body: { name: "Home", timezone: "UTC" }, user: { userId: 2 } };
    const res = makeRes();

    await CreateUserLocation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("clears default and creates user location", async () => {
    countByUserId.mockResolvedValue(1);
    create.mockResolvedValue({ userLocationId: 9 });
    const req = { body: { name: "Home", timezone: "UTC", isDefault: true }, user: { userId: 2 } };
    const res = makeRes();

    await CreateUserLocation(req, res);

    expect(clearDefault).toHaveBeenCalledWith(2);
    expect(create).toHaveBeenCalledWith(2, expect.objectContaining({ name: "Home", timezone: "UTC", isDefault: true }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, userLocation: { userLocationId: 9 } });
  });
});
