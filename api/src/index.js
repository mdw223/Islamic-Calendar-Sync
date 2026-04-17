import requestLogger, { defaultLogger } from "./middleware/Logger.js";
import express from "express";
import { appConfig } from "./Config.js";
import routes from "./endpoints/Routes.js";
import ErrorHandlerMiddleware from "./middleware/ErrorHandlerMiddleware.js";
import NotFoundMiddleware from "./middleware/NotFoundMiddleware.js";
import responseSanitizer from "./middleware/ResponseSanitizer.js";
import passport from "passport";
import { authenticateJwt } from "./Passport.js";
import cookieParser from "cookie-parser";

const app = express();

app.set("trust proxy", true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
// Set req.user when a valid JWT is present (httpOnly cookie or Authorization Bearer); otherwise leave req.user undefined
app.use(authenticateJwt);

app.use(requestLogger);
// todo add request sanitizer here
app.use(routes);
app.use(responseSanitizer); // Strip redacted keys (salt, tokens, etc.) from res.json() bodies
app.use(NotFoundMiddleware);
app.use(ErrorHandlerMiddleware);

// start server
app.listen(appConfig.PORT, "0.0.0.0", () => {
  defaultLogger.info("API server running", {
    context: "startup",
    port: appConfig.PORT,
    env: appConfig.NODE_ENV,
    healthUrl: `http://localhost:${appConfig.PORT}/health`,
  });
});