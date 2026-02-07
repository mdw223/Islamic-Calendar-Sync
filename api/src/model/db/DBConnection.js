import {dbConfig} from "../../config";
const { Pool } = require('pg');

const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount }); // TODO: add logging
    return res;
  } catch (error) {
    console.error('Query error', { text, error: error.message }); // TODO: add logging
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
  console.log('Closing database pool...');
  await pool.end();
  console.log('Database pool closed');
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = {
  query,
  getConnection,
  pool,
  shutdown
};