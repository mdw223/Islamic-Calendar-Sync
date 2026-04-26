import { getConnection } from "../../db/DBConnection.js";

const ROLLING_WINDOW_SQL = "NOW() - INTERVAL '24 hours'";

export default class ContactSubmissionDOA {
  static async reserveContactSlot(normalizedEmail, dailyLimit = 1) {
    const connection = await getConnection();
    try {
      await connection.query("BEGIN");
      await connection.query("SELECT pg_advisory_xact_lock(hashtext($1))", [normalizedEmail]);

      const existing = await connection.query(
        `SELECT ContactSubmissionId
         FROM ContactSubmission
         WHERE NormalizedEmail = $1
           AND SubmittedAt >= ${ROLLING_WINDOW_SQL}
         LIMIT $2`,
        [normalizedEmail, Number(dailyLimit)],
      );

      if (existing.rowCount >= Number(dailyLimit)) {
        await connection.query("ROLLBACK");
        return { allowed: false };
      }

      await connection.query(
        `INSERT INTO ContactSubmission (NormalizedEmail)
         VALUES ($1)`,
        [normalizedEmail],
      );

      await connection.query("COMMIT");
      return { allowed: true };
    } catch (error) {
      await connection.query("ROLLBACK");
      throw error;
    } finally {
      connection.release();
    }
  }
}
