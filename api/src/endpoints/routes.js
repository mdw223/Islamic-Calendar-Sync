import express from 'express';
import session from "express-session";
import healthRoutes from "./health/Health.js";
import { Logout } from "./users/LoginUser.js";
import Auth from "../middleware/AuthMiddleware.js";
import {
	googleLogin,
	googleRedirect,
	// microsoftLogin,
	// microsoftRedirect,
	// appleLogin,
	// appleRedirect,
	magicLinkSend,
	checkEmailPage,
	magicLinkVerify,
} from "../Passport.js";
import { AuthUser } from '../Constants.js';
import { appConfig, sessionConfig } from "../Config.js";
import GetCurrentUser from './users/GetCurrentUser.js';
import GetUserById from './users/GetUserById.js';
import DeleteCurrentUser from './users/DeleteCurrentUser.js';
import GetCalendarProviders from './calendar-providers/GetCalendarProviders.js';
import GetEvents from './events/GetEvents.js';
import GetEventsIcs from './events/GetEventsIcs.js';
import GetEventById from './events/GetEventById.js';
import CreateEvent from './events/CreateEvent.js';
import GenerateEvents from './events/GenerateEvents.js';
import ResetIslamicEvents from './events/ResetIslamicEvents.js';
import UpdateEvent from './events/UpdateEvent.js';
import DeleteEvent from './events/DeleteEvent.js';
import DeleteAllEvents from './events/DeleteAllEvents.js'
import GetDefinitions from './definitions/GetDefinitions.js';
import UpdateDefinitionPreference from './definitions/UpdateDefinitionPreference.js';
import SyncOfflineEvents from './events/SyncOfflineEvents.js';
import SyncOfflinePreferences from './definitions/SyncOfflinePreferences.js';
import GetUserLocations from './user-locations/GetUserLocations.js';
import CreateUserLocation from './user-locations/CreateUserLocation.js';
import UpdateUserLocation from './user-locations/UpdateUserLocation.js';
import DeleteUserLocation from './user-locations/DeleteUserLocation.js';
import SyncOfflineUserLocations from './user-locations/SyncOfflineUserLocations.js';
import UpdateCurrentUser from './users/UpdateCurrentUser.js';
import { RequireSubscriptionToken } from '../middleware/AuthMiddleware.js';
import GetSubscriptionEvents from './subscription/GetSubscriptionEvents.js';
import GetSubscriptionUrls from './subscription/GetSubscriptionUrls.js';
import CreateSubscriptionUrl from './subscription/CreateSubscriptionUrl.js';
import RevokeSubscription from './subscription/RevokeSubscription.js';
import UpdateSubscriptionUrl from './subscription/UpdateSubscriptionUrl.js';

const router = express.Router();

// Session middleware scoped only to Google OAuth routes — holds OIDC state across the redirect.
// Not used for app auth (JWT cookie handles that).
const googleSession = session({
  secret: sessionConfig.SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: appConfig.NODE_ENV === "production", sameSite: "lax" },
});

// Health check routes
router.use("/health", healthRoutes);

// Public subscription feed (opaque ?token=); must stay before Bearer-only app routes
router.get("/subscription/events", RequireSubscriptionToken, GetSubscriptionEvents);

// AUTH
router.get("/users/me", Auth(AuthUser.VALID_USER), GetCurrentUser);
router.put("/users/me", Auth(AuthUser.VALID_USER), UpdateCurrentUser);
router.delete("/users/me", Auth(AuthUser.VALID_USER), DeleteCurrentUser);
router.post("/users/logout", Auth(AuthUser.VALID_USER), Logout);
router.get("/users/:userId", Auth([AuthUser.SAME_USER, AuthUser.ADMIN]), GetUserById);
// Can do Auth([AuthUser.SAME_USER | AuthUser.SUBSCRIBED_USER, AuthUser.ADMIN]) for ex
router.get("/auth/google/login", googleSession, googleLogin);
router.get("/auth/google/redirect", googleSession, ...googleRedirect);
// router.get("/auth/microsoft/login", microsoftLogin);
// router.get("/auth/microsoft/redirect", ...microsoftRedirect);
// router.get("/auth/apple/login", appleLogin);
// router.get("/auth/apple/redirect", ...appleRedirect);
// router.post("/auth/apple/redirect", ...appleRedirect);
// Magic-link login
router.post("/auth/magiclink/send", ...magicLinkSend);
router.get("/login/check-email", checkEmailPage);
router.get("/auth/magiclink/verify", ...magicLinkVerify);

// Subscription management (Bearer JWT)
router.get("/subscription/urls", Auth(AuthUser.VALID_USER), GetSubscriptionUrls);
router.post("/subscription", Auth(AuthUser.VALID_USER), CreateSubscriptionUrl);
router.put("/subscription/:subscriptionTokenId", Auth(AuthUser.VALID_USER), UpdateSubscriptionUrl);
router.post("/subscription/revoke", Auth(AuthUser.VALID_USER), RevokeSubscription);

// Calendar Providers routes
router.get("/calendar-providers", Auth(AuthUser.ANY), GetCalendarProviders);

// Events routes — handlers scope all queries by req.user.userId (ownership enforced at DB layer)
router.get("/events", Auth(AuthUser.VALID_USER), GetEvents);
router.get("/events.ics", Auth(AuthUser.VALID_USER), GetEventsIcs);
router.post("/events/generate", Auth(AuthUser.VALID_USER), GenerateEvents);
router.post("/events/islamic/reset", Auth(AuthUser.VALID_USER), ResetIslamicEvents);
router.get("/events/:eventId", Auth(AuthUser.VALID_USER), GetEventById);
router.post("/events", Auth(AuthUser.VALID_USER), CreateEvent);
router.put("/events/:eventId", Auth(AuthUser.VALID_USER), UpdateEvent);
router.delete("/events/:eventId", Auth(AuthUser.VALID_USER), DeleteEvent);
router.delete("/events", Auth(AuthUser.VALID_USER), DeleteAllEvents);

// Offline-to-server sync (called once after login when IndexedDB data exists)
router.post("/events/sync", Auth(AuthUser.VALID_USER), SyncOfflineEvents);
router.post("/definitions/sync", Auth(AuthUser.VALID_USER), SyncOfflinePreferences);
router.post("/user-locations/sync", Auth(AuthUser.VALID_USER), SyncOfflineUserLocations);

// Islamic event definitions routes
router.get("/definitions", Auth(AuthUser.ANY), GetDefinitions);
router.put("/definitions/:definitionId", Auth(AuthUser.VALID_USER), UpdateDefinitionPreference);
router.get("/user-locations", Auth(AuthUser.VALID_USER), GetUserLocations);
router.post("/user-locations", Auth(AuthUser.VALID_USER), CreateUserLocation);
router.put("/user-locations/:userLocationId", Auth(AuthUser.VALID_USER), UpdateUserLocation);
router.delete("/user-locations/:userLocationId", Auth(AuthUser.VALID_USER), DeleteUserLocation);

export default router;
