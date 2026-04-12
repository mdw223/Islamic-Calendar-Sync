import { jest } from "@jest/globals";

const updateUser = jest.fn();

jest.unstable_mockModule("../../model/db/doa/UserDOA.js", () => ({
  default: { updateUser },
}));

const { default: UpdateCurrentUser } = await import("./UpdateCurrentUser.js");

describe("UpdateCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };
  }

  test("updates only provided fields and normalizes booleans", async () => {
    updateUser.mockResolvedValue({ userId: 7, name: "Ali" });
    const req = { user: { userId: 7 }, body: { name: "Ali", hanafi: 1, use24HourTime: 0 } };
    const res = makeRes();

    await UpdateCurrentUser(req, res);

    expect(updateUser).toHaveBeenCalledWith(7, { name: "Ali", hanafi: true, use24hourtime: false });
    expect(res.json).toHaveBeenCalledWith({ success: true, user: { userId: 7, name: "Ali" } });
  });

  test("returns 500 on failure", async () => {
    updateUser.mockRejectedValue(new Error("boom"));
    const req = { user: { userId: 7 }, body: {} };
    const res = makeRes();

    await UpdateCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Failed to update user profile." });
  });
});
