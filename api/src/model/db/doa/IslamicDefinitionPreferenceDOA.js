import { query } from "../../db/DBConnection.js";

/**
 * Data access layer for the UserIslamicDefinitionPreference table.
 * Stores per-user show/hide preferences for Islamic event definitions.
 */
export default class IslamicDefinitionPreferenceDOA {
  /**
   * Get all definition preferences for a user.
   * @param {number} userId
   * @returns {Promise<Array<{ definitionId: string, isHidden: boolean }>>}
   */
  static async findAllByUserId(userId) {
    const result = await query(
      `SELECT definitionid, ishidden
       FROM userislamicdefinitionpreference
       WHERE userid = $1`,
      [userId],
    );
    return result.rows.map((row) => ({
      definitionId: row.definitionid,
      isHidden: row.ishidden,
    }));
  }

  /**
   * Upsert a single preference for a user.
   * @param {number} userId
   * @param {string} definitionId
   * @param {boolean} isHidden
   * @returns {Promise<{ definitionId: string, isHidden: boolean }>}
   */
  static async upsertPreference(userId, definitionId, isHidden) {
    const result = await query(
      `INSERT INTO userislamicdefinitionpreference (userid, definitionid, ishidden)
       VALUES ($1, $2, $3)
       ON CONFLICT (userid, definitionid)
       DO UPDATE SET ishidden = EXCLUDED.ishidden
       RETURNING definitionid, ishidden`,
      [userId, definitionId, isHidden],
    );
    const row = result.rows[0];
    return { definitionId: row.definitionid, isHidden: row.ishidden };
  }

  /**
   * Bulk upsert preferences for a user.
   * @param {number} userId
   * @param {Array<{ definitionId: string, isHidden: boolean }>} preferences
   * @returns {Promise<void>}
   */
  static async bulkUpsert(userId, preferences) {
    if (!preferences || preferences.length === 0) return;

    for (const pref of preferences) {
      await query(
        `INSERT INTO userislamicdefinitionpreference (userid, definitionid, ishidden)
         VALUES ($1, $2, $3)
         ON CONFLICT (userid, definitionid)
         DO UPDATE SET ishidden = EXCLUDED.ishidden`,
        [userId, pref.definitionId, pref.isHidden],
      );
    }
  }

  /**
   * Reset all preferences for a user (delete all rows).
   * @param {number} userId
   * @returns {Promise<void>}
   */
  static async resetAll(userId) {
    await query(
      `DELETE FROM userislamicdefinitionpreference WHERE userid = $1`,
      [userId],
    );
  }
}
