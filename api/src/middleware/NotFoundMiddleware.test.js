import { jest } from "@jest/globals";
import NotFoundMiddleware from "./NotFoundMiddleware.js";

describe("NotFoundMiddleware", () => {
  test("returns 404 route not found payload", () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    NotFoundMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        message: "Route not found",
        statusCode: 404,
      },
    });
  });
});
