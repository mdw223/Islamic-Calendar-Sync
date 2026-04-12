// abstracts the env file to be able to change the values

export const appConfig = {
  PORT: process.env.API_PORT || 3000,
  NODE_ENV: process.env.NODE_ENV,
  TRUST_PROXY: true,
  BASE_URL: process.env.APP_BASE_URL,
  SUBSCRIPTION_URL: process.env.SUBSCRIPTION_URL || process.env.APP_BASE_URL,
  API_SECRET: process.env.API_SECRET
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
  LOG_QUERIES: process.env.DB_LOG_QUERIES || true
};

export const googleAuthConfig = {
  CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL
};

// Session (required by passport-openidconnect for Google OAuth state). Set SESSION_SECRET in production.
export const sessionConfig = {
  SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET,
};

export const subscriptionConfig = {
  DEFAULT_RANGE_YEARS: Number(process.env.SUBSCRIPTION_DEFAULT_RANGE_YEARS),
  MAX_ACTIVE_URLS: Number(process.env.SUBSCRIPTION_MAX_ACTIVE_URLS),
};

export const smtpConfig = {
  SMTP_PROVIDER_API_KEY: process.env.SMTP_PROVIDER_API_KEY,
  SMTP_EMAIL: process.env.SMTP_EMAIL
};
