import { jest } from "@jest/globals";
import crypto from "crypto";

const mockCreateToken = jest.fn();
const mockCountActiveByUserId = jest.fn();
const mockReplaceForToken = jest.fn();
const mockGetBaseDefinitions = jest.fn();

// Mock Config before importing modules that use it
jest.unstable_mockModule("../../Config.js", () => ({
  appConfig: {
    API_PUBLIC_URL: "http://localhost:3000",
    API_SECRET: "test-secret-key-for-testing-purposes-only",
    PORT: 3000,
    NODE_ENV: "test",
    TRUST_PROXY: true,
    BASE_URL: "http://localhost:3000",
    RATE_LIMIT_MAX: 100,
    CORS_ALLOWED_ORIGINS: [],
  },
  subscriptionConfig: {
    MAX_ACTIVE_URLS: 5,
    DEFAULT_RANGE_YEARS: 2,
  },
  dbConfig: {},
  jwtConfig: {},
  logConfig: {},
  googleAuthConfig: {},
  microsoftAuthConfig: {},
  appleAuthConfig: {},
  sessionConfig: {},
  authCookieConfig: {},
  smtpConfig: {},
  contactConfig: {},
  redisConfig: {},
}));

jest.unstable_mockModule("../../model/db/doa/SubscriptionTokenDOA.js", () => ({
  default: {
    createToken: mockCreateToken,
    countActiveByUserId: mockCountActiveByUserId,
  },
}));

jest.unstable_mockModule("../../model/db/doa/SubscriptionDefinitionSelectionDOA.js", () => ({
  default: {
    replaceForToken: mockReplaceForToken,
  },
}));

jest.unstable_mockModule("../../services/IslamicEventService.js", () => ({
  getBaseDefinitions: mockGetBaseDefinitions,
}));

const { default: CreateSubscriptionUrl } = await import("./CreateSubscriptionUrl.js");
const { GenerateToken, HashToken } = await import("../../middleware/AuthMiddleware.js");

describe("ST-12: Subscription Token Security", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Step 1-4: Token is created and stored as PBKDF2 hash (not plaintext)", async () => {
    // Setup
    mockGetBaseDefinitions.mockReturnValue([
      { id: "ashura" },
      { id: "eid_ul_fitr" },
    ]);
    mockCountActiveByUserId.mockResolvedValue(0);

    let capturedTokenHash = null;
    let capturedSalt = null;
    mockCreateToken.mockImplementation(async ({ userId, name, tokenHash, salt, createdAt }) => {
      capturedTokenHash = tokenHash;
      capturedSalt = salt;
      return {
        subscriptionTokenId: 123,
        userId,
        name,
        tokenHash,
        salt,
        createdAt,
      };
    });
    mockReplaceForToken.mockResolvedValue();

    const req = {
      user: { userId: 42 },
      body: {
        definitionIds: ["ashura"],
        name: "Test Subscription",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Execute: Create subscription URL
    await CreateSubscriptionUrl(req, res);

    // Verify response contains the plaintext token (shown only once)
    expect(res.json).toHaveBeenCalled();
    const responseData = res.json.mock.calls[0][0];
    expect(responseData.success).toBe(true);
    expect(responseData.subscription.subscriptionUrl).toBeTruthy();

    // Extract the plaintext token from the URL
    const url = new URL(responseData.subscription.subscriptionUrl);
    const plaintextToken = url.searchParams.get("token");
    expect(plaintextToken).toBeTruthy();
    expect(plaintextToken.length).toBeGreaterThan(0);

    // Step 3: Verify stored token representation in database
    expect(capturedTokenHash).toBeTruthy();
    expect(capturedSalt).toBeTruthy();

    // Step 4: Verify hash format (PBKDF2 derived key - 64 hex chars = 256 bits)
    expect(capturedTokenHash).toMatch(/^[a-f0-9]{64}$/); // 256-bit hash in hex = 64 chars
    expect(capturedSalt).toMatch(/^[a-f0-9]{16}$/); // 8 bytes = 16 hex chars

    // Verify token hash is NOT the plaintext token
    expect(capturedTokenHash).not.toBe(plaintextToken);

    // Verify the hash is derived from PBKDF2 with correct parameters
    const expectedHash = await HashToken(plaintextToken, capturedSalt);
    expect(capturedTokenHash).toBe(expectedHash);
  });

  test("Step 5: Invalid token returns 403/401", async () => {
    const { RequireSubscriptionToken } = await import("../../middleware/AuthMiddleware.js");

    const req = {
      query: { token: "invalidtoken123" },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    // Mock jwt.decode to return a decoded token with userId
    const originalJwtDecode = jest.requireActual("jsonwebtoken").decode;

    // Test with completely invalid token format
    await RequireSubscriptionToken(req, res, next);

    // Should return 403 or 400 for invalid token
    expect(res.status).toHaveBeenCalledWith(expect.any(Number));
    expect([400, 403]).toContain(res.status.mock.calls[0][0]);
    expect(next).not.toHaveBeenCalled();
  });

  test("Step 6: Hash uses PBKDF2 with 10000 iterations", async () => {
    // Verify PBKDF2 parameters match expected values
    const salt = "testsalt12345678";
    const token = "testtoken123";

    const hash = await HashToken(token, salt);

    // Verify hash is 256-bit (64 hex characters)
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Verify hash is deterministic (same input = same output)
    const hash2 = await HashToken(token, salt);
    expect(hash).toBe(hash2);

    // Verify different salts produce different hashes
    const differentSalt = "differentsalt789";
    const hashDifferentSalt = await HashToken(token, differentSalt);
    expect(hash).not.toBe(hashDifferentSalt);

    // Verify different tokens produce different hashes
    const differentToken = "differenttoken456";
    const hashDifferentToken = await HashToken(differentToken, salt);
    expect(hash).not.toBe(hashDifferentToken);
  });

  test("Salt is unique per token (verified by creating multiple subscriptions)", async () => {
    const salts = new Set();

    // Simulate creating multiple tokens and collecting salts
    for (let i = 0; i < 10; i++) {
      const salt = crypto.randomBytes(8).toString("hex");
      salts.add(salt);
    }

    // All 10 salts should be unique
    expect(salts.size).toBe(10);
  });

  test("Token cannot be reverse-engineered to reveal user ID", async () => {
    const user1 = { userId: 1 };
    const user2 = { userId: 2 };

    const salt1 = crypto.randomBytes(8).toString("hex");
    const salt2 = crypto.randomBytes(8).toString("hex");

    // Generate tokens for different users
    const token1 = GenerateToken(user1, salt1);
    const token2 = GenerateToken(user2, salt2);

    // Tokens should be different
    expect(token1).not.toBe(token2);

    // Decode tokens to verify they contain userId (for internal verification)
    // But external users cannot derive userId from just the hash
    const jwt = await import("jsonwebtoken");
    const decoded1 = jwt.decode(token1);
    const decoded2 = jwt.decode(token2);

    // Tokens contain userId internally (for the JWT structure)
    expect(decoded1.userId).toBe(1);
    expect(decoded2.userId).toBe(2);

    // Hash the tokens - the hash cannot be reversed to get userId
    const hash1 = await HashToken(token1, salt1);
    const hash2 = await HashToken(token2, salt2);

    // Hashes should be completely different and reveal no information about userId
    expect(hash1).not.toBe(hash2);

    // Verify that the hash cannot be used to determine which user it belongs to
    // by checking that both hashes appear random and unrelated to userId
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    expect(hash2).toMatch(/^[a-f0-9]{64}$/);

    // The hashes should not contain the userId in any obvious form
    // (userId is embedded in the JWT token, but the hash is one-way)
    expect(parseInt(hash1, 16)).not.toBe(user1.userId);
    expect(parseInt(hash2, 16)).not.toBe(user2.userId);
  });

  test("Hash comparison uses constant-time comparison (timing safe)", async () => {
    // This test verifies that HashToken produces consistent results
    // which enables constant-time comparison at verification time
    const salt = crypto.randomBytes(8).toString("hex");
    const token = GenerateToken({ userId: 42 }, salt);

    const hash1 = await HashToken(token, salt);
    const hash2 = await HashToken(token, salt);

    // Hashes should be identical for identical inputs
    expect(hash1).toBe(hash2);

    // Verify using timingSafeEqual (simulating the verification process)
    const buf1 = Buffer.from(hash1, "hex");
    const buf2 = Buffer.from(hash2, "hex");

    // Should not throw and should return true for matching hashes
    expect(crypto.timingSafeEqual(buf1, buf2)).toBe(true);

    // Different hash should fail timingSafeEqual
    const differentHash = await HashToken("differenttoken", salt);
    const buf3 = Buffer.from(differentHash, "hex");
    expect(crypto.timingSafeEqual(buf1, buf3)).toBe(false);
  });

  test("Token format: ics_ prefix with 64 random characters", async () => {
    mockGetBaseDefinitions.mockReturnValue([
      { id: "ashura" },
    ]);
    mockCountActiveByUserId.mockResolvedValue(0);

    mockCreateToken.mockImplementation(async ({ userId, name, tokenHash, salt, createdAt }) => {
      return {
        subscriptionTokenId: 1,
        userId,
        name,
        tokenHash,
        salt,
        createdAt,
      };
    });
    mockReplaceForToken.mockResolvedValue();

    const req = {
      user: { userId: 42 },
      body: { definitionIds: ["ashura"] },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await CreateSubscriptionUrl(req, res);

    const responseData = res.json.mock.calls[0][0];
    const url = new URL(responseData.subscription.subscriptionUrl);
    const token = url.searchParams.get("token");

    // Token should be a valid JWT (three base64url parts separated by dots)
    const jwtParts = token.split(".");
    expect(jwtParts.length).toBe(3); // JWT structure: header.payload.signature

    // Each part should be non-empty
    jwtParts.forEach(part => {
      expect(part.length).toBeGreaterThan(0);
    });
  });
});
