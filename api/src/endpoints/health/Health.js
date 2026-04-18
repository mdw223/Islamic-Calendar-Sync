import express from 'express';
import { defaultLogger, extractUserId } from '../../middleware/Logger.js';
import { pool } from '../../model/db/DBConnection.js';
const router = express.Router();

router.get('/', (req, res) => {
  return res.json({
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

router.get("/db", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      let migrationStatus = {
        trackingAvailable: false,
        latestApplied: null,
        pendingCount: null,
      };

      try {
        const latestAppliedResult = await pool.query(
          "SELECT MigrationId, AppliedAt FROM SchemaMigration ORDER BY AppliedAt DESC, MigrationId DESC LIMIT 1",
        );
        const pendingCountResult = await pool.query(`
          SELECT COUNT(*)::int AS pendingCount
          FROM (
            SELECT '001_add_event_and_preference_colors' AS MigrationId
            UNION ALL SELECT '002_add_show_arabic_event_text_to_user'
            UNION ALL SELECT '003_add_attributed_definition_id_to_event'
            UNION ALL SELECT '004_add_schema_migrations_table'
            UNION ALL SELECT '005_remove_event_type'
          ) known
          WHERE NOT EXISTS (
            SELECT 1
            FROM SchemaMigration sm
            WHERE sm.MigrationId = known.MigrationId
          )
        `);

        migrationStatus = {
          trackingAvailable: true,
          latestApplied: latestAppliedResult.rows[0]
            ? {
                id: latestAppliedResult.rows[0].migrationid,
                appliedAt: latestAppliedResult.rows[0].appliedat,
              }
            : null,
          pendingCount: pendingCountResult.rows[0]?.pendingcount ?? 0,
        };
      } catch {
        migrationStatus = {
          trackingAvailable: false,
          latestApplied: null,
          pendingCount: null,
        };
      }

      return res.json({
        status: "OK",
        database: "connected",
        migrations: migrationStatus,
      });
    } catch (err) {
      defaultLogger.error("Database connection error", {
        requestId: req?.requestId,
        userId: extractUserId(req),
        method: req?.method,
        path: req?.originalUrl?.split("?")[0] ?? req?.url,
        error: err,
      });
      return res.status(503).json({
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
