import express from 'express';
import healthRoutes from "./health/Health.js";
import { SendVerificationCode, VerifyCode, Logout } from "./users/LoginUser.js";
import Auth from "../middleware/AuthMiddleware.js";
import { googleLogin, googleRedirect } from "../passport.js";
import { AuthUser } from '../constants.js';
import GetCurrentUser from './users/GetCurrentUser.js';
import GetUserById from './users/GetUserById.js';

const router = express.Router();

// Health check routes
router.use("/health", healthRoutes);
router.get("/users/me", Auth(AuthUser.ANY_USER), GetCurrentUser);
router.post("/users/send-code", SendVerificationCode);
router.post("/users/verify-code", VerifyCode);
router.post("/users/logout", Auth(AuthUser.ANY_USER), Logout);
router.get("/users/:userId", Auth([AuthUser.SAME_USER, AuthUser.ADMIN]), GetUserById);
// Can do Auth([AuthUser.SAME_USER | AuthUser.SUBSCRIBED_USER, AuthUser.ADMIN]) for ex
router.get("/auth/google/login", googleLogin);
router.get("/auth/google/redirect", ...googleRedirect);

export default router;