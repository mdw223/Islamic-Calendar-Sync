import { jest } from "@jest/globals";

const upsertPreference = jest.fn();
const updateHideByDefinitionId = jest.fn();
const updateColorByDefinitionId = jest.fn();

jest.unstable_mockModule("../../model/db/doa/IslamicDefinitionPreferenceDOA.js", () => ({
  default: { upsertPreference },
}));

jest.unstable_mockModule("../../model/db/doa/EventDOA.js", () => ({
  default: { updateHideByDefinitionId, updateColorByDefinitionId },
}));

const { default: SyncOfflinePreferences } = await import("./SyncOfflinePreferences.js");

describe("SyncOfflinePreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("returns 400 when preferences is not an array", async () => {
    const req = { body: {}, user: { userId: 1 } };
    const res = makeRes();

    await SyncOfflinePreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("returns 200 for empty preferences", async () => {
    const req = { body: { preferences: [] }, user: { userId: 1 } };
    const res = makeRes();

    await SyncOfflinePreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, syncedCount: 0 });
  });

  test("returns 400 when too many preferences are provided", async () => {
    const req = { body: { preferences: Array.from({ length: 201 }, (_, i) => ({ definitionId: String(i), isHidden: false })) }, user: { userId: 1 } };
    const res = makeRes();

    await SyncOfflinePreferences(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("syncs valid preferences and counts them", async () => {
    const req = { body: { preferences: [{ definitionId: "a", isHidden: true }, { definitionId: "b", isHidden: false }] }, user: { userId: 1 } };
    const res = makeRes();
    upsertPreference.mockResolvedValue(undefined);
    updateHideByDefinitionId.mockResolvedValue(1);

    await SyncOfflinePreferences(req, res);

    expect(upsertPreference).toHaveBeenNthCalledWith(1, 1, "a", true, null);
    expect(upsertPreference).toHaveBeenNthCalledWith(2, 1, "b", false, null);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, syncedCount: 2 });
  });

  test("syncs optional defaultColor and cascades color updates", async () => {
    const req = {
      body: {
        preferences: [{ definitionId: "a", isHidden: false, defaultColor: "#334455" }],
      },
      user: { userId: 1 },
    };
    const res = makeRes();
    upsertPreference.mockResolvedValue(undefined);
    updateHideByDefinitionId.mockResolvedValue(1);
    updateColorByDefinitionId.mockResolvedValue(1);

    await SyncOfflinePreferences(req, res);

    expect(upsertPreference).toHaveBeenCalledWith(1, "a", false, "#334455");
    expect(updateColorByDefinitionId).toHaveBeenCalledWith(1, "a", "#334455");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, syncedCount: 1 });
  });
});
