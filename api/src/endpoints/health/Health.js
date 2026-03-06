import express from 'express';
import { defaultLogger, extractUserId } from '../../middleware/Logger.js';
import { pool } from '../../model/db/DBConnection.js';
import { sendJson } from '../SendJson.js';

const router = express.Router();

router.get('/', (req, res) => {
  return sendJson(res, {
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

router.get("/db", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      return sendJson(res, { status: "OK", database: "connected" });
    } catch (err) {
      defaultLogger.error("Database connection error", {
        requestId: req?.requestId,
        userId: extractUserId(req),
        method: req?.method,
        path: req?.originalUrl?.split("?")[0] ?? req?.url,
        error: err,
      });
      return sendJson(res, {
        status: "ERROR",
        database: "disconnected",
        error: {
          message: err.message,
          code: err.code,
          address: err.address,
          port: err.port,
        },
      }, 503);
    }
  });

export default router;
