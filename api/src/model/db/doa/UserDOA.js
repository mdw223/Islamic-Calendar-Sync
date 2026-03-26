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

  static async findAuthProviderName(userId) {
    const result = await query(
      `SELECT apt.name
       FROM "User" u
       JOIN authprovidertype apt ON apt.authprovidertypeid = u.authprovidertypeid
       WHERE u.userid = $1`,
      [userId],
    );
    return result.rows[0]?.name ?? null;
  }

  /**
   * Create a new user with minimal fields (Email, Name).
   * Defaults to Email auth provider type.
   * @param {{ email: string, name: string, authProviderTypeId?: number }} userData
   * @returns {Promise<ReturnType<User.fromRow>>}
   */
  static async createUser({ email, name, authProviderTypeId = 4 }) {
    const result = await query(
      `INSERT INTO "User" (email, name, authprovidertypeid, createdat, updatedat)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [email, name, authProviderTypeId],
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

  static async updateGeneratedYearsRange(userId, start, end) {
    return this.updateUser(userId, {
      generatedyearsstart: start,
      generatedyearsend: end,
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

  /**
   * Find user by stored SHA-256 hex hash of opaque subscription token.
   * @param {string} subscriptionTokenHash
   * @returns {Promise<ReturnType<User.fromRow>|null>}
   */
  static async findBySubscriptionTokenHash(subscriptionTokenHash) {
    const result = await query(
      `SELECT * FROM "User" WHERE subscriptiontokenhash = $1`,
      [subscriptionTokenHash],
    );
    const row = result.rows[0];
    return row ? User.fromRow(row) : null;
  }
}
