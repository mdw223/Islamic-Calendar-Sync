import requestLogger, { defaultLogger } from "./middleware/Logger.js";
import express from "express";
import { appConfig, sessionConfig } from "./config.js";
import routes from "./endpoints/Routes.js";
import ErrorHandlerMiddleware from "./middleware/ErrorHandlerMiddleware.js";
import NotFoundMiddleware from "./middleware/NotFoundMiddleware.js";
import { AuthMiddleware } from "./middleware/AuthMiddleware.js";
import responseSanitizer from "./middleware/ResponseSanitizer.js";
import passport from "passport";
import session from "express-session";
import { optionalJwtAuth } from "./passport.js";
import cookieParser from "cookie-parser";

const app = express();

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
  defaultLogger.info("API server running", {
    context: "startup",
    port: appConfig.PORT,
    env: appConfig.NODE_ENV,
    healthUrl: `http://localhost:${appConfig.PORT}/health`,
  });
});