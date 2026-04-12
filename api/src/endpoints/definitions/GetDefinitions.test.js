import { jest } from "@jest/globals";

const getMergedDefinitions = jest.fn();

jest.unstable_mockModule("../../services/IslamicEventService.js", () => ({
  getMergedDefinitions,
}));

const { default: GetDefinitions } = await import("./GetDefinitions.js");

describe("GetDefinitions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns merged definitions for current user", async () => {
    getMergedDefinitions.mockResolvedValue([{ id: "a" }]);
    const req = { user: { userId: 12 } };
    const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

    await GetDefinitions(req, res);

    expect(getMergedDefinitions).toHaveBeenCalledWith(12);
    expect(res.json).toHaveBeenCalledWith({ success: true, definitions: [{ id: "a" }] });
  });

  test("returns 500 on failure", async () => {
    getMergedDefinitions.mockRejectedValue(new Error("boom"));
    const req = { user: { userId: 12 } };
    const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

    await GetDefinitions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to load definitions." });
  });
});
