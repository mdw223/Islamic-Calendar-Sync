import { jest } from "@jest/globals";

const deleteUser = jest.fn();

jest.unstable_mockModule("../../model/db/doa/UserDOA.js", () => ({
  default: { deleteUser },
}));

const { default: DeleteCurrentUser } = await import("./DeleteCurrentUser.js");

describe("DeleteCurrentUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeRes() {
    return { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() };
  }

  test("returns 404 when user not found", async () => {
    deleteUser.mockResolvedValue(false);
    const req = { user: { userId: 9 } };
    const res = makeRes();

    await DeleteCurrentUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test("returns 204 when deleted", async () => {
    deleteUser.mockResolvedValue(true);
    const req = { user: { userId: 9 } };
    const res = makeRes();

    await DeleteCurrentUser(req, res);

    expect(deleteUser).toHaveBeenCalledWith(9);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });
});
