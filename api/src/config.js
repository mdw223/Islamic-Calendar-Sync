// abstracts the env file to be able to change the values

export const appConfig = {
  PORT: process.env.API_PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  TRUST_PROXY: true,
  BASE_URL: process.env.APP_BASE_URL || "http://localhost:5000"
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


