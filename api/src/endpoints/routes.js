import express from 'express';
import healthRoutes from './Health.js';
import LoginUser from './users/LoginUser.js'
import {GetCurrentUser, GetUserById} from './users/GetUser.js'
import Auth, { SAME_USER, ADMIN, ANY_USER } from '../middleware/AuthMiddleware.js';

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

router.get('/users/me', Auth(ANY_USER), GetCurrentUser); //TODO: finish
router.get('/users/login', LoginUser);
router.get('/users/:userId', Auth(SAME_USER, ADMIN), GetUserById);

export default router;