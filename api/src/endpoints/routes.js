import express from 'express';
import healthRoutes from "./Health.js";
import { SendVerificationCode, VerifyCode, Logout } from "./users/LoginUser.js";
import { GetCurrentUser, GetUserById } from "./users/GetUser.js";
import Auth, {
  SAME_USER,
  ADMIN,
  ANY_USER,
} from "../middleware/AuthMiddleware.js";
import GoogleAuthRouter from "./GoogleAuth.js";

const router = express.Router();

// Health check routes
router.use("/health", healthRoutes);
router.get("/users/me", Auth(ANY_USER), GetCurrentUser);
router.post("/users/send-code", SendVerificationCode);
router.post("/users/verify-code", VerifyCode);
router.post("/users/logout", Auth(ANY_USER), Logout);
router.get("/users/:userId", Auth(SAME_USER, ADMIN), GetUserById);

// Google OAuth2 routes handled by dedicated router
router.use("/auth/google", GoogleAuthRouter);

export default router;