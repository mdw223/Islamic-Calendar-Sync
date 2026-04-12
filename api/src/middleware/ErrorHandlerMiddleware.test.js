import { jest } from "@jest/globals";

const errorMock = jest.fn();
const extractUserIdMock = jest.fn(() => 99);
const sanitizeForLogMock = jest.fn((v) => v);

jest.unstable_mockModule("./Logger.js", () => ({
  defaultLogger: {
    error: errorMock,
  },
  extractUserId: extractUserIdMock,
  sanitizeForLog: sanitizeForLogMock,
}));

const { default: ErrorHandlerMiddleware } = await import("./ErrorHandlerMiddleware.js");

describe("ErrorHandlerMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("uses publicMessage for client-safe 4xx responses", () => {
    const req = {
      requestId: "req-1",
      method: "GET",
      originalUrl: "/events?from=2026-01-01",
      ip: "127.0.0.1",
      get: jest.fn(() => "test-agent"),
      query: { from: "2026-01-01" },
      body: { any: true },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const err = {
      statusCode: 400,
      publicMessage: "Bad input",
      message: "unsafe details",
      name: "ValidationError",
    };

    ErrorHandlerMiddleware(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: "Bad input",
        statusCode: 400,
        requestId: "req-1",
      },
    });
    expect(errorMock).toHaveBeenCalledTimes(1);
  });

  test("normalizes invalid status to 500 and hides server details", () => {
    const req = { requestId: "req-2", originalUrl: "/x" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const err = {
      status: 200,
      message: "db secret",
      expose: true,
    };

    ErrorHandlerMiddleware(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: "Internal Server Error",
        statusCode: 500,
        requestId: "req-2",
      },
    });
  });

  test("uses generic request failed message for exposed 4xx errors", () => {
    const req = { requestId: "req-3", originalUrl: "/x" };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    const err = {
      statusCode: 422,
      expose: true,
      message: "unsafe validation details",
    };

    ErrorHandlerMiddleware(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: "Request failed",
        statusCode: 422,
        requestId: "req-3",
      },
    });
  });
});
