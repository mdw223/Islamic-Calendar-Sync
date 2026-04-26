import { jest } from "@jest/globals";

const mockFindById = jest.fn();
const mockFindActiveByUserIdAndHash = jest.fn();

jest.unstable_mockModule("../model/db/doa/UserDOA.js", () => ({
  default: {
    findById: mockFindById,
  },
}));

jest.unstable_mockModule("../model/db/doa/SubscriptionTokenDOA.js", () => ({
  default: {
    findActiveByUserIdAndHash: mockFindActiveByUserIdAndHash,
  },
}));

const {
  AuthenticateUser,
  AuthMiddleware,
  Auth,
} = await import("./AuthMiddleware.js");
const { AuthUser } = await import("../Constants.js");

describe("AuthMiddleware core behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("AuthenticateUser rejects requests without req.user", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    AuthenticateUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authentication failed",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("AuthenticateUser continues when req.user exists", () => {
    const req = { user: { userId: 7 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    AuthenticateUser(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("AuthMiddleware assigns VALID_USER and SAME_USER roles", () => {
    const req = {
      user: { userId: 42, isAdmin: false },
      params: { userId: "42" },
    };
    const res = {};
    const next = jest.fn();

    AuthMiddleware(req, res, next);

    expect((req.userRoles & AuthUser.VALID_USER) === AuthUser.VALID_USER).toBe(true);
    expect((req.userRoles & AuthUser.SAME_USER) === AuthUser.SAME_USER).toBe(true);
    expect((req.userRoles & AuthUser.ADMIN) === AuthUser.ADMIN).toBe(false);
    expect(next).toHaveBeenCalledTimes(1);
  });

  test("AuthMiddleware assigns ADMIN role for admin users", () => {
    const req = {
      user: { userId: 1, isAdmin: true },
      params: { userId: "99" },
    };
    const res = {};
    const next = jest.fn();

    AuthMiddleware(req, res, next);

    expect((req.userRoles & AuthUser.ADMIN) === AuthUser.ADMIN).toBe(true);
    expect((req.userRoles & AuthUser.VALID_USER) === AuthUser.VALID_USER).toBe(true);
    expect((req.userRoles & AuthUser.SAME_USER) === AuthUser.SAME_USER).toBe(false);
  });

  test("Auth(AuthUser.ANY) allows unauthenticated request", () => {
    const req = { user: undefined, params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    Auth(AuthUser.ANY)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("Auth with a single required role blocks unauthorized users", () => {
    const req = { user: undefined, params: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    Auth(AuthUser.VALID_USER)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Authorization failed",
    });
  });

  test("Auth allows any matching role from role arrays", () => {
    const req = {
      user: { userId: 5, isAdmin: false },
      params: { userId: "5" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    Auth([AuthUser.ADMIN, AuthUser.SAME_USER])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
