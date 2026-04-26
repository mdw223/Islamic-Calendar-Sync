import requestLogger, { defaultLogger } from "./middleware/Logger.js";
import express from "express";
import { appConfig } from "./Config.js";
import routes from "./endpoints/Routes.js";
import ErrorHandlerMiddleware from "./middleware/ErrorHandlerMiddleware.js";
import NotFoundMiddleware from "./middleware/NotFoundMiddleware.js";
import responseSanitizer from "./middleware/ResponseSanitizer.js";
import requestSanitizer from "./middleware/RequestSanitizer.js";
import passport from "passport";
import { authenticateJwt } from "./Passport.js";
import cookieParser from "cookie-parser";
import { pool } from "./model/db/DBConnection.js";
import { rateLimiter } from "./middleware/RateLimiter.js";
import cors from "cors";
import { verifySmtpConnection } from "./services/SmtpMailer.js";
import { logMigrationStatus } from "./services/MigrationStatusLogger.js";

const app = express();

app.set("trust proxy", true);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (no Origin header) and explicitly allowlisted browser origins.
    if (!origin || appConfig.CORS_ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
// Set req.user when a valid JWT is present (httpOnly cookie or Authorization Bearer); otherwise leave req.user undefined
app.use(authenticateJwt);
app.use(rateLimiter);

app.use(requestLogger);
app.use(requestSanitizer); // Strip __proto__, constructor, prototype keys from req.body/query/params
app.use(responseSanitizer); // Wrap res.json() to strip redacted keys (salt, tokens, etc.) before sending
app.use(routes);
app.use(NotFoundMiddleware);
app.use(ErrorHandlerMiddleware);

// start server
app.listen(appConfig.PORT, "0.0.0.0", () => {
  void logMigrationStatus(pool);
  void verifySmtpConnection();
  defaultLogger.info("API server running", {
    context: "startup",
    port: appConfig.PORT,
    env: appConfig.NODE_ENV,
    healthUrl: `http://localhost:${appConfig.PORT}/health`,
  });
});