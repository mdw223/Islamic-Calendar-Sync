import requestLogger from './middleware/Logger.js';
import express from 'express';
import { appConfig } from './config.js';
import routes from './endpoints/Routes.js';
import ErrorHandlerMiddleware from './middleware/ErrorHandlerMiddleware.js';
import NotFoundMiddleware from './middleware/NotFoundMiddleware.js';

const app = express();

app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use(routes);

app.use(NotFoundMiddleware);
app.use(ErrorHandlerMiddleware);

// Start server
app.listen(appConfig.PORT, '0.0.0.0', () => {
    console.log(`🚀 API server running on port ${appConfig.PORT}`);
    console.log(`📊 Environment: ${appConfig.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${appConfig.PORT}/health`);
});