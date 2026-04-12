import { jest } from "@jest/globals";

const syncMany = jest.fn();

jest.unstable_mockModule("../../model/db/doa/UserLocationDOA.js", () => ({
  default: { syncMany },
}));

const { default: SyncOfflineUserLocations } = await import("./SyncOfflineUserLocations.js");

describe("SyncOfflineUserLocations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("returns 400 when userLocations is not an array", async () => {
    const req = { body: {}, user: { userId: 4 } };
    const res = makeRes();

    await SyncOfflineUserLocations(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns syncedCount zero for empty array", async () => {
    const req = { body: { userLocations: [] }, user: { userId: 4 } };
    const res = makeRes();

    await SyncOfflineUserLocations(req, res);

    expect(res.json).toHaveBeenCalledWith({ success: true, syncedCount: 0 });
  });

  test("returns 400 when a location is missing required fields", async () => {
    const req = { body: { userLocations: [{ name: "Home" }] }, user: { userId: 4 } };
    const res = makeRes();

    await SyncOfflineUserLocations(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("syncs normalized locations", async () => {
    syncMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const req = {
      body: {
        userLocations: [
          { name: "Home", timezone: "UTC", latitude: 1, longitude: 2, isDefault: true },
          { name: "Work", timezone: "UTC" },
        ],
      },
      user: { userId: 4 },
    };
    const res = makeRes();

    await SyncOfflineUserLocations(req, res);

    expect(syncMany).toHaveBeenCalledWith(4, [
      { name: "Home", latitude: 1, longitude: 2, timezone: "UTC", isDefault: true },
      { name: "Work", latitude: null, longitude: null, timezone: "UTC", isDefault: false },
    ]);
    expect(res.json).toHaveBeenCalledWith({ success: true, syncedCount: 2 });
  });
});
