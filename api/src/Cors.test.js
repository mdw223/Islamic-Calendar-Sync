import { jest } from "@jest/globals";
import express from "express";
import cors from "cors";
import supertest from "supertest";

describe("CORS middleware", () => {
  function createApp(allowedOrigins) {
    const app = express();

    const corsOptions = {
      origin(origin, callback) {
        // Allow non-browser clients (no Origin header) and explicitly allowlisted browser origins.
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.get("/test", (req, res) => res.json({ ok: true }));
    app.use((err, req, res, next) => {
      // CORS errors are passed to error handler; return 403 for blocked origins
      if (err.message === "CORS origin not allowed") {
        return res.status(403).json({ success: false, message: "CORS origin not allowed" });
      }
      next(err);
    });
    return app;
  }

  test("allows requests with no Origin header (non-browser clients)", async () => {
    const app = createApp(["https://example.com"]);
    const res = await supertest(app).get("/test");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("allows requests from explicitly allowed origins", async () => {
    const allowedOrigins = ["https://www.islamiccalendarsync.com", "https://islamiccalendarsync.com"];
    const app = createApp(allowedOrigins);

    for (const origin of allowedOrigins) {
      const res = await supertest(app).get("/test").set("Origin", origin);
      expect(res.status).toBe(200);
      expect(res.headers["access-control-allow-origin"]).toBe(origin);
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
      expect(res.headers["vary"]).toContain("Origin");
    }
  });

  test("blocks requests from unauthorized origins with 403", async () => {
    const app = createApp(["https://www.islamiccalendarsync.com"]);

    const res = await supertest(app)
      .get("/test")
      .set("Origin", "https://evil-site.com");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("CORS origin not allowed");
  });

  test("handles preflight OPTIONS requests correctly", async () => {
    const allowedOrigin = "https://www.islamiccalendarsync.com";
    const app = createApp([allowedOrigin]);

    const res = await supertest(app)
      .options("/test")
      .set("Origin", allowedOrigin)
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type,Authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBe(allowedOrigin);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
    expect(res.headers["access-control-allow-methods"]).toContain("GET");
    expect(res.headers["access-control-allow-headers"]).toContain("Content-Type");
  });

  test("credentials header is present for allowed origins", async () => {
    const allowedOrigin = "https://www.islamiccalendarsync.com";
    const app = createApp([allowedOrigin]);

    const res = await supertest(app).get("/test").set("Origin", allowedOrigin);

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  test("Vary header is set correctly to prevent cache poisoning", async () => {
    const allowedOrigins = ["https://www.islamiccalendarsync.com", "https://islamiccalendarsync.com"];
    const app = createApp(allowedOrigins);

    const res1 = await supertest(app).get("/test").set("Origin", allowedOrigins[0]);
    const res2 = await supertest(app).get("/test").set("Origin", allowedOrigins[1]);

    expect(res1.headers["vary"]).toContain("Origin");
    expect(res2.headers["vary"]).toContain("Origin");
  });

  test("multiple different origins each get correct CORS headers", async () => {
    const allowedOrigins = [
      "https://www.islamiccalendarsync.com",
      "https://islamiccalendarsync.com",
      "http://localhost:5173",
    ];
    const app = createApp(allowedOrigins);

    for (const origin of allowedOrigins) {
      const res = await supertest(app).get("/test").set("Origin", origin);
      expect(res.status).toBe(200);
      expect(res.headers["access-control-allow-origin"]).toBe(origin);
    }
  });
});
