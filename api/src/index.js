import requestLogger, { defaultLogger } from "./middleware/Logger.js";
import express from "express";
import { appConfig, sessionConfig } from "./Config.js";
import routes from "./endpoints/Routes.js";
import ErrorHandlerMiddleware from "./middleware/ErrorHandlerMiddleware.js";
import NotFoundMiddleware from "./middleware/NotFoundMiddleware.js";
import responseSanitizer from "./middleware/ResponseSanitizer.js";
import passport from "passport";
import session from "express-session";
import { optionalJwtAuth } from "./Passport.js";
import cookieParser from "cookie-parser";
import { pool } from "./model/db/DBConnection.js";

const app = express();
const EXPECTED_LATEST_MIGRATION = "005_remove_event_type";

async function logMigrationStatus() {
  try {
    const latestAppliedResult = await pool.query(
      "SELECT MigrationId, AppliedAt FROM SchemaMigration ORDER BY AppliedAt DESC, MigrationId DESC LIMIT 1",
    );

    const expectedResult = await pool.query(
      "SELECT 1 FROM SchemaMigration WHERE MigrationId = $1 LIMIT 1",
      [EXPECTED_LATEST_MIGRATION],
    );

    const latestApplied = latestAppliedResult.rows[0] ?? null;
    const isUpToDate = expectedResult.rowCount > 0;

    if (!isUpToDate) {
      defaultLogger.warn("Database migrations are not up to date", {
        context: "startup",
        expectedLatestMigration: EXPECTED_LATEST_MIGRATION,
        latestAppliedMigration: latestApplied?.migrationid ?? null,
        latestAppliedAt: latestApplied?.appliedat ?? null,
      });
      return;
    }

    defaultLogger.info("Database migrations are up to date", {
      context: "startup",
      expectedLatestMigration: EXPECTED_LATEST_MIGRATION,
      latestAppliedMigration: latestApplied?.migrationid ?? null,
      latestAppliedAt: latestApplied?.appliedat ?? null,
    });
  } catch (err) {
    defaultLogger.warn("Migration status check skipped", {
      context: "startup",
      expectedLatestMigration: EXPECTED_LATEST_MIGRATION,
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }
}

app.set("trust proxy", true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: sessionConfig.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: appConfig.NODE_ENV === "production", sameSite: "lax" },
  })
);
app.use(passport.initialize());
// Optional JWT: set req.user when Authorization: Bearer <token> is valid; otherwise leave req.user undefined
app.use(optionalJwtAuth);

app.use(requestLogger);
app.use(responseSanitizer); // Strip redacted keys (salt, tokens, etc.) from res.json() bodies

app.use(routes);

app.use(NotFoundMiddleware);
app.use(ErrorHandlerMiddleware);

// start server
app.listen(appConfig.PORT, "0.0.0.0", () => {
  void logMigrationStatus();
  defaultLogger.info("API server running", {
    context: "startup",
    port: appConfig.PORT,
    env: appConfig.NODE_ENV,
    healthUrl: `http://localhost:${appConfig.PORT}/health`,
  });
});