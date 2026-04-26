import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { createClient } from 'redis'
import { appConfig, redisConfig } from '../Config.js'
import { defaultLogger } from './logger.js'

// Create a Redis client of docker container
const client = createClient({
	url: `redis://${redisConfig.HOST}:${redisConfig.PORT}`,
});
// Handle Redis client errors
client.on('error', (err) => defaultLogger.error('Redis client error', { error: err }));
// Connect to the Redis server
await client.connect();
// Create and use the rate limiter

export const rateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: appConfig.RATE_LIMIT_MAX,
	standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	keyGenerator: (req) => req.user?.userId?.toString() ?? ipKeyGenerator(req.ip), // Use user ID if available, otherwise use IP
	store: new RedisStore({
		sendCommand: (...args) => client.sendCommand(args),
	}),
});