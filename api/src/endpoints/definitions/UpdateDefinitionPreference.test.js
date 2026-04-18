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
    upsertPreference.mockResolvedValue({ defaultColor: null });
    updateHideByDefinitionId.mockResolvedValue(7);
    const req = { params: { definitionId: "ashura" }, body: { isHidden: true }, user: { userId: 6 } };
    const res = makeRes();

    await UpdateDefinitionPreference(req, res);

    expect(upsertPreference).toHaveBeenCalledWith(6, "ashura", true, null);
    expect(updateHideByDefinitionId).toHaveBeenCalledWith(6, "ashura", true);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      definitionId: "ashura",
      isHidden: true,
      defaultColor: null,
      eventsUpdated: 7,
      colorUpdated: 0,
    });
  });

  test("updates color and cascades to matching events", async () => {
    upsertPreference.mockResolvedValue({ defaultColor: "#112233" });
    updateHideByDefinitionId.mockResolvedValue(2);
    updateColorByDefinitionId.mockResolvedValue(2);
    const req = {
      params: { definitionId: "ashura" },
      body: { isHidden: false, defaultColor: "#112233" },
      user: { userId: 6 },
    };
    const res = makeRes();

    await UpdateDefinitionPreference(req, res);

    expect(upsertPreference).toHaveBeenCalledWith(6, "ashura", false, "#112233");
    expect(updateColorByDefinitionId).toHaveBeenCalledWith(6, "ashura", "#112233");
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      definitionId: "ashura",
      isHidden: false,
      defaultColor: "#112233",
      eventsUpdated: 2,
      colorUpdated: 2,
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
