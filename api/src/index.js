import logger from './middleware/logger.js';
import express from 'express';
import { app as appConfig } from './config.js';
import routes from './endpoints/routes.js';
import ErrorHandlerMiddleware from './middleware/ErrorHandlerMiddleware.js';
import NotFoundMiddleware from './middleware/NotFoundMiddleware.js';
require('dotenv').config();

const app = express();

// Trust proxy (for environments behind proxies like Nginx)
app.set('trust proxy', true);

// Built-in middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware would go here
app.use(logger);

// Routes
app.use(routes);

// Error handling middleware (must be last)
app.use(NotFoundMiddleware);
app.use(ErrorHandlerMiddleware);

// Start server
app.listen(appConfig.PORT, '0.0.0.0', () => {
    console.log(`🚀 API server running on port ${appConfig.PORT}`);
    console.log(`📊 Environment: ${appConfig.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${appConfig.PORT}/health`);
});