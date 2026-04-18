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
      `SELECT definitionid, ishidden, defaultcolor
       FROM userislamicdefinitionpreference
       WHERE userid = $1`,
      [userId],
    );
    return result.rows.map((row) => ({
      definitionId: row.definitionid,
      isHidden: row.ishidden,
      defaultColor: row.defaultcolor ?? null,
    }));
  }

  /**
   * Upsert a single preference for a user.
   * @param {number} userId
   * @param {string} definitionId
   * @param {boolean} isHidden
   * @param {string | null} defaultColor
   * @returns {Promise<{ definitionId: string, isHidden: boolean, defaultColor: string | null }>}
   */
  static async upsertPreference(userId, definitionId, isHidden, defaultColor = null) {
    const result = await query(
      `INSERT INTO userislamicdefinitionpreference (userid, definitionid, ishidden, defaultcolor)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (userid, definitionid)
       DO UPDATE SET
         ishidden = EXCLUDED.ishidden,
         defaultcolor = COALESCE(EXCLUDED.defaultcolor, userislamicdefinitionpreference.defaultcolor)
       RETURNING definitionid, ishidden, defaultcolor`,
      [userId, definitionId, isHidden, defaultColor],
    );
    const row = result.rows[0];
    return {
      definitionId: row.definitionid,
      isHidden: row.ishidden,
      defaultColor: row.defaultcolor ?? null,
    };
  }

  /**
   * Bulk upsert preferences for a user.
   * @param {number} userId
  * @param {Array<{ definitionId: string, isHidden: boolean, defaultColor?: string | null }>} preferences
   * @returns {Promise<void>}
   */
  static async bulkUpsert(userId, preferences) {
    if (!preferences || preferences.length === 0) return;

    for (const pref of preferences) {
      await query(
        `INSERT INTO userislamicdefinitionpreference (userid, definitionid, ishidden, defaultcolor)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (userid, definitionid)
         DO UPDATE SET
           ishidden = EXCLUDED.ishidden,
           defaultcolor = COALESCE(EXCLUDED.defaultcolor, userislamicdefinitionpreference.defaultcolor)`,
        [userId, pref.definitionId, pref.isHidden, pref.defaultColor ?? null],
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
