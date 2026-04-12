import { jest } from "@jest/globals";

const upsertPreference = jest.fn();
const updateHideByDefinitionId = jest.fn();

jest.unstable_mockModule("../../model/db/doa/IslamicDefinitionPreferenceDOA.js", () => ({
  default: { upsertPreference },
}));

jest.unstable_mockModule("../../model/db/doa/EventDOA.js", () => ({
  default: { updateHideByDefinitionId },
}));

const { default: UpdateDefinitionPreference } = await import("./UpdateDefinitionPreference.js");

describe("UpdateDefinitionPreference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("returns 400 when isHidden is missing or invalid", async () => {
    const req = { params: { definitionId: "ashura" }, body: {}, user: { userId: 6 } };
    const res = makeRes();

    await UpdateDefinitionPreference(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Request body must contain "isHidden" as a boolean.',
    });
  });

  test("upserts preference and updates events", async () => {
    upsertPreference.mockResolvedValue(undefined);
    updateHideByDefinitionId.mockResolvedValue(7);
    const req = { params: { definitionId: "ashura" }, body: { isHidden: true }, user: { userId: 6 } };
    const res = makeRes();

    await UpdateDefinitionPreference(req, res);

    expect(upsertPreference).toHaveBeenCalledWith(6, "ashura", true);
    expect(updateHideByDefinitionId).toHaveBeenCalledWith(6, "ashura", true);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      definitionId: "ashura",
      isHidden: true,
      eventsUpdated: 7,
    });
  });

  test("returns 500 on failure", async () => {
    upsertPreference.mockRejectedValue(new Error("boom"));
    const req = { params: { definitionId: "ashura" }, body: { isHidden: true }, user: { userId: 6 } };
    const res = makeRes();

    await UpdateDefinitionPreference(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to update definition preference." });
  });
});
