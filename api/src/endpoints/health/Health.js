import express from 'express';
import { defaultLogger, extractUserId } from '../../middleware/Logger.js';
import { pool } from '../../model/db/DBConnection.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

router.get("/db", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "OK", database: "connected" });
    } catch (err) {
      defaultLogger.error("Database connection error", {
        requestId: req?.requestId,
        userId: extractUserId(req),
        method: req?.method,
        path: req?.originalUrl?.split("?")[0] ?? req?.url,
        error: err,
      });
      res.status(503).json({
        status: "ERROR",
        database: "disconnected",
        error: {
          message: err.message,
          code: err.code,
          address: err.address,
          port: err.port,
        },
      });
    }
  });

export default router;
