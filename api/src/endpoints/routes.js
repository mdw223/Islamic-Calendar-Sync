import express from 'express';
import healthRoutes from "./health/Health.js";
import { SendVerificationCode, VerifyCode, Logout } from "./users/LoginUser.js";
import Auth from "../middleware/AuthMiddleware.js";
import { googleLogin, googleRedirect } from "../Passport.js";
import { AuthUser } from '../Constants.js';
import GetCurrentUser from './users/GetCurrentUser.js';
import GetUserById from './users/GetUserById.js';
import GetCalendarProviders from './calendar-providers/GetCalendarProviders.js';
import GetEvents from './events/GetEvents.js';
import GetEventById from './events/GetEventById.js';
import CreateEvent from './events/CreateEvent.js';
import GenerateEvents from './events/GenerateEvents.js';
import UpdateEvent from './events/UpdateEvent.js';
import DeleteEvent from './events/DeleteEvent.js';
import CreateGuestSession from './users/CreateGuestSession.js';
import GetDefinitions from './definitions/GetDefinitions.js';
import UpdateDefinitionPreference from './definitions/UpdateDefinitionPreference.js';

const router = express.Router();

// Health check routes
router.use("/health", healthRoutes);
router.get("/users/me", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), GetCurrentUser);
router.post("/users/send-code", SendVerificationCode);
router.post("/users/verify-code", VerifyCode);
router.post("/users/logout", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), Logout);
router.get("/users/:userId", Auth([AuthUser.SAME_USER, AuthUser.ADMIN]), GetUserById);
// Can do Auth([AuthUser.SAME_USER | AuthUser.SUBSCRIBED_USER, AuthUser.ADMIN]) for ex
router.get("/auth/google/login", googleLogin);
router.get("/auth/google/redirect", ...googleRedirect);
router.post("/auth/guest", CreateGuestSession);

// Calendar Providers routes
router.get("/calendar-providers", Auth(AuthUser.ANY), GetCalendarProviders);

// Events routes — handlers scope all queries by req.user.userId (ownership enforced at DB layer)
router.get("/events", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), GetEvents);
router.post("/events/generate", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), GenerateEvents);
router.get("/events/:eventId", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), GetEventById);
router.post("/events", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), CreateEvent);
router.put("/events/:eventId", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), UpdateEvent);
router.delete("/events/:eventId", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), DeleteEvent);

// Islamic event definitions routes
router.get("/definitions", Auth(AuthUser.ANY), GetDefinitions);
router.put("/definitions/:definitionId", Auth([AuthUser.VALID_USER, AuthUser.GUEST_USER]), UpdateDefinitionPreference);

export default router;