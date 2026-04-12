import { jest } from "@jest/globals";

const findDefinitionIdsByTokenId = jest.fn();
const getBaseDefinitions = jest.fn();
const getEventsIcs = jest.fn();

jest.unstable_mockModule("../../model/db/doa/SubscriptionDefinitionSelectionDOA.js", () => ({
  default: { findDefinitionIdsByTokenId },
}));

jest.unstable_mockModule("../../services/IslamicEventService.js", () => ({
  getBaseDefinitions,
}));

jest.unstable_mockModule("../events/GetEventsIcs.js", () => ({
  default: getEventsIcs,
}));

const { default: GetSubscriptionEvents } = await import("./GetSubscriptionEvents.js");
const { SubscriptionDefinitionId } = await import("../../constants.js");

describe("GetSubscriptionEvents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("applies default range and delegates to GetEventsIcs", async () => {
    getBaseDefinitions.mockReturnValue([{ id: "ashura" }, { id: "eid_ul_fitr" }]);
    findDefinitionIdsByTokenId.mockResolvedValue([]);
    getEventsIcs.mockResolvedValue("ok");

    const req = {
      query: {},
      subscriptionToken: { subscriptionTokenId: 10 },
    };
    const res = {};

    await GetSubscriptionEvents(req, res);

    expect(req.query.from).toBeTruthy();
    expect(req.query.to).toBeTruthy();
    expect(req.subscriptionSelection.includeUserCreatedEvents).toBe(true);
    expect(req.subscriptionSelection.selectedDefinitionIds).toEqual(
      expect.arrayContaining(["ashura", "eid_ul_fitr", SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS]),
    );
    expect(getEventsIcs).toHaveBeenCalledWith(req, res);
  });

  test("uses saved selection when present", async () => {
    findDefinitionIdsByTokenId.mockResolvedValue(["ashura"]);
    getEventsIcs.mockResolvedValue("ok");

    const req = {
      query: { from: "2026-01-01", to: "2026-01-31" },
      subscriptionToken: { subscriptionTokenId: 10 },
    };
    const res = {};

    await GetSubscriptionEvents(req, res);

    expect(req.subscriptionSelection.selectedDefinitionIds).toEqual(["ashura"]);
    expect(req.subscriptionSelection.includeUserCreatedEvents).toBe(false);
  });

  test("returns 500 on failure", async () => {
    findDefinitionIdsByTokenId.mockRejectedValue(new Error("boom"));
    const req = { query: {}, subscriptionToken: { subscriptionTokenId: 10 } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await GetSubscriptionEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to get subscription events" });
  });
});
