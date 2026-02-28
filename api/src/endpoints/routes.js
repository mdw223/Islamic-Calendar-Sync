import express from 'express';
import healthRoutes from "./health/Health.js";
import { SendVerificationCode, VerifyCode, Logout } from "./users/LoginUser.js";
import Auth from "../middleware/AuthMiddleware.js";
import { googleLogin, googleRedirect } from "../passport.js";
import { AuthUser } from '../constants.js';
import GetCurrentUser from './users/GetCurrentUser.js';
import GetUserById from './users/GetUserById.js';
import GetProviders from './providers/GetProviders.js';
import GetEvents from './events/GetEvents.js';
import GetEventById from './events/GetEventById.js';
import CreateEvent from './events/CreateEvent.js';
import BulkCreateEvents from './events/BulkCreateEvents.js';
import UpdateEvent from './events/UpdateEvent.js';
import DeleteEvent from './events/DeleteEvent.js';
import CreateGuestSession from './users/CreateGuestSession.js';

const router = express.Router();

// Health check routes
router.use("/health", healthRoutes);
router.get("/users/me", Auth(AuthUser.ANY), GetCurrentUser);
router.post("/users/send-code", SendVerificationCode);
router.post("/users/verify-code", VerifyCode);
router.post("/users/logout", Auth(AuthUser.ANY), Logout);
router.get("/users/:userId", Auth([AuthUser.SAME_USER, AuthUser.ADMIN]), GetUserById);
// Can do Auth([AuthUser.SAME_USER | AuthUser.SUBSCRIBED_USER, AuthUser.ADMIN]) for ex
router.get("/auth/google/login", googleLogin);
router.get("/auth/google/redirect", ...googleRedirect);
router.post("/auth/guest", CreateGuestSession);

// Providers routes
router.get("/providers", Auth(AuthUser.ANY), GetProviders);

// Events routes
router.get("/events", Auth(AuthUser.ANY), GetEvents);
router.post("/events/batch", Auth(AuthUser.ANY), BulkCreateEvents); // TODO: move the event generation to the backend
router.get("/events/:eventId", Auth(AuthUser.ANY), GetEventById);
router.post("/events", Auth(AuthUser.ANY), CreateEvent);
router.put("/events/:eventId", Auth(AuthUser.ANY), UpdateEvent);
router.delete("/events/:eventId", Auth(AuthUser.ANY), DeleteEvent);

export default router;