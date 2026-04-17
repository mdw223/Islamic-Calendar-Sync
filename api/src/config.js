// abstracts the env file to be able to change the values

export const appConfig = {
  PORT: process.env.API_PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  TRUST_PROXY: true,
  BASE_URL: process.env.APP_BASE_URL || "http://localhost:5000",
  SUBSCRIPTION_URL: process.env.SUBSCRIPTION_URL || process.env.APP_BASE_URL,
  API_SECRET: process.env.API_SECRET || 'secret'
};

// JWT signing/verifying (auth). Set JWT_SECRET in production; optional JWT_EXPIRY_DAYS, JWT_ALGORITHM.
export const jwtConfig = {
  EXPIRY_DAYS: process.env.JWT_EXPIRY_DAYS || 7,
  SECRET: process.env.JWT_SECRET || "change-me-in-production",
  ALGORITHM: process.env.JWT_ALGORITHM || "HS256"
};

export const dbConfig = {
  HOST: process.env.DB_HOST || 'database',
  USER: process.env.POSTGRES_USER || 'postgres_user',
  PASSWORD: process.env.POSTGRES_PASSWORD || '',
  DATABASE: process.env.POSTGRES_DB || 'ics_development',
  PORT: process.env.DB_PORT || 5432
};

export const logConfig = {
  LEVEL: process.env.LOG_LEVEL || "info",
  LOG_QUERIES: process.env.DB_LOG_QUERIES || true
};

export const googleAuthConfig = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
};

// Session: used only on Google OAuth routes (/auth/google/login and /auth/google/redirect) to hold OIDC state.
// Not used for app auth — JWT cookie handles that. Set SESSION_SECRET in production.
export const sessionConfig = {
  SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET || "change-me-in-production",
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
  },
};

export const subscriptionConfig = {
  DEFAULT_RANGE_YEARS: Number(process.env.SUBSCRIPTION_DEFAULT_RANGE_YEARS) || 2,
  MAX_ACTIVE_URLS: Number(process.env.SUBSCRIPTION_MAX_ACTIVE_URLS) || 3,
};
