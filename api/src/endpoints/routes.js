import express from 'express';
import healthRoutes from './health.js';
import apiRoutes from './api.js'; // Add your API routes here

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

// API routes
router.use('/api', apiRoutes);

export default router;