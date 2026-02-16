import express from 'express';
import healthRoutes from "./health/Health.js";
import { SendVerificationCode, VerifyCode, Logout } from "./users/LoginUser.js";
import { GetCurrentUser, GetUserById } from "./users/GetUser.js";
import Auth, {
  SAME_USER,
  ADMIN,
  ANY_USER,
} from "../middleware/AuthMiddleware.js";
import { googleLogin, googleRedirect } from "../passport.js";

const router = express.Router();

// Health check routes
router.use("/health", healthRoutes);
router.get("/users/me", Auth(ANY_USER), GetCurrentUser);
router.post("/users/send-code", SendVerificationCode);
router.post("/users/verify-code", VerifyCode);
router.post("/users/logout", Auth(ANY_USER), Logout);
router.get("/users/:userId", Auth(SAME_USER, ADMIN), GetUserById);

router.get("/auth/google/login", googleLogin);
router.get("/auth/google/redirect", ...googleRedirect);

export default router;