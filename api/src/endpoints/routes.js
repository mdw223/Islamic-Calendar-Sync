import express from 'express';
import healthRoutes from './health.js';
import LoginUser from './users/login-user.js'

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

router.get('/users/me', GetCurrentUser); // TODO: finish
router.get('/users/login', LoginUser);
router.get('/users/:userId', Auth(SAME_USER, ADMIN), GetUserById);

export default router;