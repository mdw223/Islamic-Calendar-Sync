import { defaultLogger } from "../middleware/Logger.js";
import { getMigrationStatus } from "../model/db/MigrationStatus.js";

export async function logMigrationStatus(pool) {
  try {
    const status = await getMigrationStatus(pool);

    if (!status.isUpToDate) {
      defaultLogger.warn("Database migrations are not up to date", {
        context: "startup",
        latestKnownMigration: status.latestKnownMigrationId,
        latestAppliedMigration: status.latestAppliedMigrationId,
        latestAppliedAt: status.latestAppliedAt,
        pendingCount: status.pendingCount,
        pendingMigrations: status.pendingMigrationIds,
      });
      return;
    }

    defaultLogger.info("Database migrations are up to date", {
      context: "startup",
      latestKnownMigration: status.latestKnownMigrationId,
      latestAppliedMigration: status.latestAppliedMigrationId,
      latestAppliedAt: status.latestAppliedAt,
      pendingCount: status.pendingCount,
    });
  } catch (err) {
    defaultLogger.warn("Migration status check skipped", {
      context: "startup",
      error: {
        message: err.message,
        code: err.code,
      },
    });
  }
}
