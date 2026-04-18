import { jest } from '@jest/globals'
import express from 'express'

// ---------------------------------------------------------------------------
// In-memory store — replaces RedisStore so tests need no real Redis connection.
// Implements the express-rate-limit v8 store interface.
// ---------------------------------------------------------------------------
class InMemoryStore {
	constructor() {
		this.hits = new Map()
	}

	init() {}

	async increment(key) {
		const count = (this.hits.get(key) ?? 0) + 1
		this.hits.set(key, count)
		return {
			totalHits: count,
			resetTime: new Date(Date.now() + 15 * 60 * 1000),
		}
	}

	async decrement(key) {
		const count = this.hits.get(key) ?? 0
		if (count > 0) this.hits.set(key, count - 1)
	}

	async resetKey(key) {
		this.hits.delete(key)
	}

	clear() {
		this.hits.clear()
	}
}

// ---------------------------------------------------------------------------
// Mocks — must be registered before the dynamic import of RateLimiter.js
// ---------------------------------------------------------------------------
const store = new InMemoryStore()

jest.unstable_mockModule('redis', () => ({
	createClient: jest.fn(() => ({
		on: jest.fn().mockReturnThis(),
		connect: jest.fn().mockResolvedValue(undefined),
		sendCommand: jest.fn(),
	})),
}))

jest.unstable_mockModule('rate-limit-redis', () => ({
	RedisStore: jest.fn(() => store),
}))

// Drive RATE_LIMIT_MAX down to 3 so tests stay fast
process.env.RATE_LIMIT_MAX = '3'

// Dynamic import — happens after mocks are in place
const { rateLimiter } = await import('./RateLimiter.js')
const { default: supertest } = await import('supertest')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Express app that optionally stamps req.user before the
 * rate limiter runs, matching the real middleware order in index.js.
 *
 * @param {number|undefined} userId  When provided, every request appears authenticated as this user.
 */
function buildApp(userId) {
	const app = express()
	app.set('trust proxy', true)
	app.use((_req, _res, next) => {
		// authenticateJwt would normally do this; we simulate it here
		if (userId !== undefined) _req.user = { userId }
		next()
	})
	app.use(rateLimiter)
	app.get('/test', (_req, res) => res.status(200).json({ ok: true }))
	return app
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('RateLimiter middleware', () => {
	beforeEach(() => {
		store.clear()
	})

	test('unauthenticated: allows requests up to the limit, then returns 429', async () => {
		const agent = supertest(buildApp(undefined))

		for (let i = 0; i < 3; i++) {
			const res = await agent.get('/test')
			expect(res.status).toBe(200)
		}

		const blocked = await agent.get('/test')
		expect(blocked.status).toBe(429)
	})

	test('authenticated: allows requests up to the limit per userId, then returns 429', async () => {
		const agent = supertest(buildApp(42))

		for (let i = 0; i < 3; i++) {
			const res = await agent.get('/test')
			expect(res.status).toBe(200)
		}

		const blocked = await agent.get('/test')
		expect(blocked.status).toBe(429)
	})

	test('authenticated: different users have independent counters', async () => {
		const agentA = supertest(buildApp(1))
		const agentB = supertest(buildApp(2))

		// Exhaust user 1's limit
		for (let i = 0; i < 3; i++) await agentA.get('/test')
		expect((await agentA.get('/test')).status).toBe(429)

		// User 2 is unaffected
		expect((await agentB.get('/test')).status).toBe(200)
	})

	test('authenticated: userId takes precedence over IP — requests from different IPs share the same counter', async () => {
		const app = buildApp(7)

		// 2 requests from "IP A"
		await supertest(app).get('/test').set('X-Forwarded-For', '1.2.3.4')
		await supertest(app).get('/test').set('X-Forwarded-For', '1.2.3.4')

		// 1 request from "IP B" — still counts against userId 7
		await supertest(app).get('/test').set('X-Forwarded-For', '9.9.9.9')

		// 4th request (any IP) should be blocked because the userId bucket is full
		const blocked = await supertest(app)
			.get('/test')
			.set('X-Forwarded-For', '1.2.3.4')
		expect(blocked.status).toBe(429)
	})
})
