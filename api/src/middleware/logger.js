import { createLogger, format, transports } from 'winston';
import morgan from 'morgan';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Create a stream object for Morgan to use
const stream = {
  write: (message) => logger.info(message.trim())
};

// Morgan middleware for HTTP request logging
export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

// Custom error logger middleware
export const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next(err);
};

export default requestLogger;