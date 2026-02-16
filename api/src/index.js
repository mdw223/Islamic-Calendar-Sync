import requestLogger from "./middleware/Logger.js";
import express from "express";
import { appConfig, jwtSecret } from "./config.js";
import routes from "./endpoints/Routes.js";
import ErrorHandlerMiddleware from "./middleware/ErrorHandlerMiddleware.js";
import NotFoundMiddleware from "./middleware/NotFoundMiddleware.js";
import passport from "passport";
import "./passport.js";
import cookieParser from "cookie-parser";
import session from "express-session";

const app = express();

app.set("trust proxy", true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: jwtSecret, 
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: appConfig.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — login session
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use(requestLogger);

app.use(routes);

app.use(NotFoundMiddleware);
app.use(ErrorHandlerMiddleware);

// start server
app.listen(appConfig.PORT, "0.0.0.0", () => {
  console.log(`🚀 API server running on port ${appConfig.PORT}`);
  console.log(`📊 Environment: ${appConfig.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${appConfig.PORT}/health`);
});