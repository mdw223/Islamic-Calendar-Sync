import { query } from "../../db/DBConnection.js";

/**
 * Data access layer for the USERS table.
 * Matches the schema in the wiki (UserId, Email, Name, CreatedAt, UpdatedAt, etc.).
 */
export default class UserDOA {
  /**
   * Get user by email address.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async getUserByEmail(email) {
    const result = await query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    return result.rows[0] || null;
  }

  /**
   * Get user by ID.
   * @param {number} userId
   * @returns {Promise<Object|null>}
   */
  static async findById(userId) {
    const result = await query(
      "SELECT * FROM users WHERE userid = $1",
      [userId],
    );
    return result.rows[0] || null;
  }

  /**
   * Create a new user with minimal fields (Email, Name).
   * Other columns will use database defaults.
   * @param {{ email: string, name: string }} userData
   * @returns {Promise<Object>}
   */
  static async createUser({ email, name }) {
    const result = await query(
      `INSERT INTO users (email, name, createdat, updatedat)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [email, name],
    );
    return result.rows[0];
  }

  /**
   * Generic update for arbitrary user fields.
   * @param {number} userId
   * @param {Record<string, any>} fields
   * @returns {Promise<Object|null>}
   */
  static async updateUser(userId, fields) {
    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return this.findById(userId);
    }

    const setClauses = keys.map(
      (key, index) => `${key} = $${index + 2}`,
    );

    const values = keys.map((k) => fields[k]);

    await query(
      `UPDATE users
       SET ${setClauses.join(", ")}, updatedat = NOW()
       WHERE userid = $1`,
      [userId, ...values],
    );

    return this.findById(userId);
  }

  // Convenience helpers for the key columns in the wiki schema

  static async updateLastLogin(userId, lastLogin = new Date()) {
    return this.updateUser(userId, { lastlogin: lastLogin });
  }

  static async updateLanguage(userId, language) {
    return this.updateUser(userId, { language });
  }

  static async updateEventConfiguration(userId, start, end) {
    return this.updateUser(userId, {
      eventconfigurationstart: start,
      eventconfigurationend: end,
    });
  }

  static async updatePrayerConfiguration(userId, start, end) {
    return this.updateUser(userId, {
      prayerconfigurationstart: start,
      prayerconfigurationend: end,
    });
  }

  static async updateCalculationSettings(
    userId,
    calculationMethodId,
    hanafi,
  ) {
    return this.updateUser(userId, {
      calculationmethodid: calculationMethodId,
      hanafi,
    });
  }

  static async updateSalt(userId, salt) {
    return this.updateUser(userId, { salt });
  }
}
