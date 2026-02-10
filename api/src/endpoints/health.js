import express from 'express';
import { pool } from '../model/db/DBConnection.js';

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
      console.error('Database connection error');
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
