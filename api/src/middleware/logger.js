import audit from 'express-request-logger';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/audit.log' })
  ]
});

export const requestLogger = audit({
  logger: logger,
  excludeURLs: ['/health', '/metrics'], // Skip health checks
  request: {
    maskBody: ['password', 'token', 'secret'], // Mask sensitive fields
    excludeHeaders: ['authorization', 'cookie'], // Exclude headers
    maxBodyLength: 1000 // Limit body length
  },
  response: {
    maskBody: ['session_token', 'access_token'],
    maxBodyLength: 1000
  },
  levels: {
    '2xx': 'info',
    '4xx': 'warn',
    '5xx': 'error'
  }
});

export default logger;
