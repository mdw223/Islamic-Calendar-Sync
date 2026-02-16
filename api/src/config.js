// abstracts the env file to be able to change the values

export const appConfig = {
  PORT: process.env.API_PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  TRUST_PROXY: true,
  BASE_URL: process.env.APP_BASE_URL || "http://localhost:5000"
};

// Used for signing/verifying JWT cookies (auth). Set JWT_SECRET or SESSION_SECRET in production.
export const jwtSecret =
  process.env.JWT_SECRET ||
   process.env.SESSION_SECRET || 
   "change-me-in-production"; // TODO: Use JWT

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


