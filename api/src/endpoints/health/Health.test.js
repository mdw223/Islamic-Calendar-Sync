import { jest } from "@jest/globals";

const loggerError = jest.fn();
const extractUserId = jest.fn(() => 77);
const poolQuery = jest.fn();

jest.unstable_mockModule("../../middleware/Logger.js", () => ({
  defaultLogger: { error: loggerError },
  extractUserId,
}));

jest.unstable_mockModule("../../model/db/DBConnection.js", () => ({
  pool: { query: poolQuery },
}));

const { default: healthRouter } = await import("./Health.js");

function getRouteHandler(path) {
  const layer = healthRouter.stack.find((l) => l.route && l.route.path === path);
  return layer.route.stack[0].handle;
}

describe("Health routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET / returns OK payload", () => {
    const handler = getRouteHandler("/");
    const req = {};
    const res = { json: jest.fn().mockReturnThis() };

    handler(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "OK", version: "1.0.0" }),
    );
  });

  test("GET /db returns connected when query succeeds", async () => {
    const handler = getRouteHandler("/db");
    poolQuery.mockResolvedValue({});
    const req = {};
    const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

    await handler(req, res);

    expect(poolQuery).toHaveBeenCalledWith("SELECT 1");
    expect(res.json).toHaveBeenCalledWith({ status: "OK", database: "connected" });
  });

  test("GET /db returns 503 and logs when query fails", async () => {
    const handler = getRouteHandler("/db");
    poolQuery.mockRejectedValue({ message: "down", code: "ECONNREFUSED", address: "127.0.0.1", port: 5432 });
    const req = { requestId: "r1", method: "GET", originalUrl: "/health/db?x=1", url: "/health/db" };
    const res = { json: jest.fn().mockReturnThis(), status: jest.fn().mockReturnThis() };

    await handler(req, res);

    expect(loggerError).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      status: "ERROR",
      database: "disconnected",
      error: {
        message: "down",
        code: "ECONNREFUSED",
        address: "127.0.0.1",
        port: 5432,
      },
    });
  });
});
