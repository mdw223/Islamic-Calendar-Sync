import requestLogger from "./middleware/Logger.js";
import express from "express";
import { appConfig, dbConfig } from "./config.js";
import routes from "./endpoints/Routes.js";
import ErrorHandlerMiddleware from "./middleware/ErrorHandlerMiddleware.js";
import NotFoundMiddleware from "./middleware/NotFoundMiddleware.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import session from "express-session";
import { pool } from "./model/db/DBConnection.js";

const app = express();

/** Run once on startup to verify DB is reachable; logs result and continues either way. */
async function testDatabaseConnection() {
  const safeConfig = { ...dbConfig, PASSWORD: dbConfig.PASSWORD ? "***" : "(empty)" };
  console.log("DB config (startup check):", safeConfig);
  try {
    await pool.query("SELECT 1");
    console.log("Database connection OK");
  } catch (err) {
    console.error("Database connection FAILED:", {
      message: err.message,
      code: err.code,
      address: err.address,
      port: err.port,
    });
  }
}

app.set("trust proxy", true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60 * 1000, // 10 min — only needed for OAuth redirect flow
    },
  }),
);
app.use(passport.initialize());

app.use(requestLogger);

app.use(routes);

app.use(NotFoundMiddleware);
app.use(ErrorHandlerMiddleware);

// Start server after DB check
testDatabaseConnection().then(() => {
  app.listen(appConfig.PORT, "0.0.0.0", () => {
    console.log(`🚀 API server running on port ${appConfig.PORT}`);
    console.log(`📊 Environment: ${appConfig.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${appConfig.PORT}/health`);
  });
});