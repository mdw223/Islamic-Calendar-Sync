// abstracts the env file to be able to change the values
import { AuthProviderKey } from "./Constants.js";

export const appConfig = {
  PORT: process.env.API_PORT || 3000,
  NODE_ENV: process.env.NODE_ENV,
  TRUST_PROXY: true,
  BASE_URL: process.env.APP_BASE_URL,
  API_SECRET: process.env.API_SECRET,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  CORS_ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  API_PUBLIC_URL: process.env.API_PUBLIC_URL || process.env.APP_BASE_URL,
};

// JWT signing/verifying (auth). Set JWT_SECRET in production; optional JWT_EXPIRY_DAYS, JWT_ALGORITHM.
export const jwtConfig = {
  EXPIRY_DAYS: process.env.JWT_EXPIRY_DAYS || 7,
  SECRET: process.env.JWT_SECRET,
  ALGORITHM: process.env.JWT_ALGORITHM
};

export const dbConfig = {
  HOST: process.env.DB_HOST,
  USER: process.env.POSTGRES_USER,
  PASSWORD: process.env.POSTGRES_PASSWORD,
  DATABASE: process.env.POSTGRES_DB,
  PORT: process.env.DB_PORT
};

export const logConfig = {
  LEVEL: process.env.LOG_LEVEL,
  LOG_QUERIES: process.env.DB_LOG_QUERIES?.toLowerCase?.() === "true"
};

export const googleAuthConfig = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
};

// Session: used only on Google OAuth routes (/auth/google/login and /auth/google/redirect) to hold OIDC state.
// Not used for app auth — JWT cookie handles that. Set SESSION_SECRET in production.
export const microsoftAuthConfig = {
  CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
  CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
  CALLBACK_URL: process.env.MICROSOFT_CALLBACK_URL,
  TENANT: process.env.MICROSOFT_TENANT,
  SCOPE: process.env.MICROSOFT_SCOPE,
};

export const appleAuthConfig = {
  CLIENT_ID: process.env.APPLE_CLIENT_ID,
  TEAM_ID: process.env.APPLE_TEAM_ID,
  KEY_ID: process.env.APPLE_KEY_ID,
  CALLBACK_URL: process.env.APPLE_CALLBACK_URL,
  PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
  PRIVATE_KEY_LOCATION: process.env.APPLE_PRIVATE_KEY_LOCATION,
  SCOPE: process.env.APPLE_SCOPE,
};

// Session (required by passport-openidconnect for Google OAuth state). Set SESSION_SECRET in production.
export const sessionConfig = {
  SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET,
};

// Shared cookie options for the auth JWT cookie (token).
// Must be identical on res.cookie() (set) and res.clearCookie() (clear); any mismatch prevents clearing.
export const authCookieConfig = {
  NAME: "token",
  OPTIONS: {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: (process.env.NODE_ENV || "development") === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (matches JWT expiry)
  },
};

export const subscriptionConfig = {
  DEFAULT_RANGE_YEARS: Number(process.env.SUBSCRIPTION_DEFAULT_RANGE_YEARS),
  MAX_ACTIVE_URLS: Number(process.env.SUBSCRIPTION_MAX_ACTIVE_URLS),
};

export const smtpConfig = {
  HOST: process.env.SMTP_HOST,
  PORT: Number(process.env.SMTP_PORT) || 465,
  SECURE: String(process.env.SMTP_SECURE ?? "true").toLowerCase() === "true",
  USER: process.env.SMTP_USER,
  PASS: process.env.SMTP_PASS,
  FROM: process.env.SMTP_FROM,
};

export const contactConfig = {
  TO_EMAIL: process.env.CONTACT_TO_EMAIL || process.env.SMTP_FROM,
  DAILY_LIMIT_PER_EMAIL: Number(process.env.CONTACT_DAILY_LIMIT_PER_EMAIL) || 1,
  IP_RATE_LIMIT_MAX: Number(process.env.CONTACT_IP_RATE_LIMIT_MAX) || 5,
};

export const redisConfig = {
  HOST: process.env.REDIS_HOST || 'redis',
  PORT: process.env.REDIS_PORT || 6379,
};
