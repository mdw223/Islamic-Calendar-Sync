import { dbConfig, logConfig } from "../../config.js";
import pkg from "pg";
const { Pool } = pkg;

// node-pg expects lowercase keys (host, user, etc.); dbConfig uses uppercase
const pgConfig = {
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DATABASE,
  port: Number(dbConfig.PORT) || 5432,
};
const pool = new Pool(pgConfig);

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

let cachedLoggerPromise = null;
async function getAppLogger() {
  if (!cachedLoggerPromise) {
    cachedLoggerPromise = import("../../middleware/Logger.js")
      .then((m) => m.defaultLogger)
      .catch(() => null);
  }
  return cachedLoggerPromise;
}

function isLogTableInsert(sqlText) {
  return /^\s*insert\s+into\s+log\b/i.test(String(sqlText || ""));
}

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  const suppressLogging = isLogTableInsert(text);
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Avoid noisy SQL logging by default. Enable timing logs explicitly.
    if (!suppressLogging && logConfig.LOG_QUERIES) {
      const logger = await getAppLogger();
      if (logger) {
        logger.debug("db_query", { durationMs: duration, rowCount: res.rowCount });
      } else {
        console.log("Executed query", { durationMs: duration, rowCount: res.rowCount });
      }
    }
    return res;
  } catch (error) {
    if (!suppressLogging) {
      const logger = await getAppLogger();
      if (logger) {
        logger.error("db_query_error", {
          error: { message: error.message, code: error.code, stack: error.stack },
        });
      } else {
        console.error("Query error", { error: error.message, code: error.code });
      }
    }
    throw error;
  }
};

// Get a connection from the pool
const getConnection = async () => {
  const connection = await pool.connect();
  const query = connection.query;
  const release = connection.release;
  
  // Set a timeout of 5 seconds, after which we will log this connection's last query
  const timeout = setTimeout(() => {
    console.error('A connection has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Monkey patch the query method to keep track of the last query executed
  connection.query = (...args) => {
    connection.lastQuery = args;
    return query.apply(connection, args);
  };
  
  connection.release = () => {
    clearTimeout(timeout);
    connection.query = query;
    connection.release = release;
    return release.apply(connection);
  };
  
  return connection;
};

// Graceful shutdown
const shutdown = async () => {
  console.log("Closing database pool...");
  await pool.end();
  console.log("Database pool closed");
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { query, getConnection, pool, shutdown };