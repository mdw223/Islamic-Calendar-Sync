import { jest } from "@jest/globals";
import responseSanitizer from "./ResponseSanitizer.js";

describe("ResponseSanitizer", () => {
  test("removes redacted keys recursively from objects and arrays", () => {
    const req = {};
    const sentBodies = [];
    const res = {
      json: jest.fn((body) => {
        sentBodies.push(body);
        return body;
      }),
    };
    const next = jest.fn();

    responseSanitizer(req, res, next);

    const body = {
      user: {
        id: 1,
        password: "secret",
        salt: "pepper",
        profile: {
          accessToken: "x",
          refreshToken: "y",
          name: "Ali",
        },
      },
      items: [
        { ok: true, refreshtoken: "remove-me" },
        { nested: { accesstoken: "remove-too", value: 5 } },
      ],
    };

    res.json(body);

    expect(next).toHaveBeenCalledTimes(1);
    expect(sentBodies[0]).toEqual({
      user: {
        id: 1,
        profile: {
          name: "Ali",
        },
      },
      items: [
        { ok: true },
        { nested: { value: 5 } },
      ],
    });
  });

  test("passes non-object response bodies unchanged", () => {
    const req = {};
    const res = {
      json: jest.fn((body) => body),
    };
    const next = jest.fn();

    responseSanitizer(req, res, next);

    expect(res.json("ok")).toBe("ok");
    expect(res.json(null)).toBeNull();
  });
});
