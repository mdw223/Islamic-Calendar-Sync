import { jest } from "@jest/globals";

const findById = jest.fn();
const findAuthProviderName = jest.fn();
const findAllByUserId = jest.fn();

jest.unstable_mockModule("../../model/db/doa/UserDOA.js", () => ({
  default: { findById, findAuthProviderName },
}));

jest.unstable_mockModule("../../model/db/doa/UserLocationDOA.js", () => ({
  default: { findAllByUserId },
}));

const { default: GetCurrentUser } = await import("./GetCurrentUser.js");

describe("GetCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("returns 404 when user is missing", async () => {
    findById.mockResolvedValue(null);
    const req = { user: { userId: 9 } };
    const res = makeRes();

    await GetCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns current user with auth provider and locations", async () => {
    findById.mockResolvedValue({ toJSON: () => ({ userId: 9, email: "u@test.com" }) });
    findAuthProviderName.mockResolvedValue("Email");
    findAllByUserId.mockResolvedValue([{ id: 1 }]);
    const req = { user: { userId: 9 } };
    const res = makeRes();

    await GetCurrentUser(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        userId: 9,
        email: "u@test.com",
        authProviderName: "Email",
        userLocations: [{ id: 1 }],
      },
    });
  });

  test("returns 500 on error", async () => {
    findById.mockRejectedValue(new Error("boom"));
    const req = { user: { userId: 9 } };
    const res = makeRes();

    await GetCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to get current user" });
  });
});
