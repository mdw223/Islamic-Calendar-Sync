import { query } from "../../db/DBConnection.js";
import { User } from "../../models/User.js";

/**
 * Data access layer for the USER table.
 * Returns User objects (camelCase) via User.fromRow.
 */
export default class UserDOA {
  /**
   * Get user by email address.
   * @param {string} email
   * @returns {Promise<ReturnType<User.fromRow>|null>}
   */
  static async getUserByEmail(email) {
    const result = await query(
      `SELECT * FROM "User" WHERE email = $1`,
      [email],
    );
    const row = result.rows[0];
    return row ? User.fromRow(row) : null;
  }

  /**
   * Get user by ID.
   * @param {number} userId
   * @returns {Promise<ReturnType<User.fromRow>|null>}
   */
  static async findById(userId) {
    const result = await query(
      `SELECT * FROM "User" WHERE userid = $1`,
      [userId],
    );
    const row = result.rows[0];
    return row ? User.fromRow(row) : null;
  }

  /**
   * Create a new user with minimal fields (Email, Name).
   * @param {{ email: string, name: string }} userData
   * @returns {Promise<ReturnType<User.fromRow>>}
   */
  static async createUser({ email, name }) {
    const result = await query(
      `INSERT INTO "User" (email, name, createdat, updatedat)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [email, name],
    );
    return User.fromRow(result.rows[0]);
  }

  /**
   * Generic update for arbitrary user fields (keys in snake_case for DB).
   * @param {number} userId
   * @param {Record<string, any>} fields
   * @returns {Promise<ReturnType<User.fromRow>|null>}
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
      `UPDATE "User"
       SET ${setClauses.join(", ")}, updatedat = NOW()
       WHERE userid = $1`,
      [userId, ...values],
    );

    return this.findById(userId);
  }

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
