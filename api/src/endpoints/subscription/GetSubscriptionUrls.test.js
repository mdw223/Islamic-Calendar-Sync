import { jest } from "@jest/globals";

const findActiveByUserId = jest.fn();
const findDefinitionIdsByTokenIds = jest.fn();
const getBaseDefinitions = jest.fn();
const sign = jest.fn();

jest.unstable_mockModule("../../Config.js", () => ({
  appConfig: {
    API_PUBLIC_URL: "http://localhost:5000",
    API_SECRET: "secret",
  },
  subscriptionConfig: {
    MAX_ACTIVE_URLS: 3,
  },
}));

jest.unstable_mockModule("../../model/db/doa/SubscriptionTokenDOA.js", () => ({
  default: { findActiveByUserId },
}));

jest.unstable_mockModule("../../model/db/doa/SubscriptionDefinitionSelectionDOA.js", () => ({
  default: { findDefinitionIdsByTokenIds },
}));

jest.unstable_mockModule("../../services/IslamicEventService.js", () => ({
  getBaseDefinitions,
}));

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: { sign },
}));

const { default: GetSubscriptionUrls } = await import("./GetSubscriptionUrls.js");

describe("GetSubscriptionUrls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  }

  test("returns subscription urls with selected definitions", async () => {
    findActiveByUserId.mockResolvedValue([
      { subscriptionTokenId: 1, name: "A", salt: "s1", createdAt: "2026-01-01" },
      { subscriptionTokenId: 2, name: "B", salt: "s2", createdAt: "2026-01-02" },
    ]);
    getBaseDefinitions.mockReturnValue([{ id: "ashura" }]);
    findDefinitionIdsByTokenIds.mockResolvedValue(new Map([[1, ["ashura"]]]));
    sign.mockReturnValue("jwt-token");

    const req = { user: { userId: 9 } };
    const res = makeRes();

    await GetSubscriptionUrls(req, res);

    expect(findActiveByUserId).toHaveBeenCalledWith(9);
    expect(res.status).toHaveBeenCalledWith(200);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(true);
    expect(payload.subscriptionUrls.length).toBe(2);
    expect(payload.subscriptionUrls[0].subscriptionUrl).toContain("/api/subscription/events?token=");
  });

  test("returns 500 on failure", async () => {
    findActiveByUserId.mockRejectedValue(new Error("db error"));
    const req = { user: { userId: 9 } };
    const res = makeRes();

    await GetSubscriptionUrls(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to get subscription urls" });
  });
});
