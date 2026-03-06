import { query } from "../../db/DBConnection.js";
import { Provider } from "../../models/Provider.js";

/**
 * Data access layer for the PROVIDER table.
 * Returns Provider objects (camelCase) via Provider.fromRow.
 */
export default class ProviderDOA {
  /**
   * Get all providers for a user.
   * @param {number} userId
   * @returns {Promise<Provider[]>}
   */
  static async findAllByUserId(userId) {
    const result = await query(
      "SELECT * FROM provider WHERE userid = $1 ORDER BY createdat ASC",
      [userId],
    );
    return result.rows.map(Provider.fromRow);
  }

  /**
   * @param {number} userId
   * @param {number} providerTypeId
   * @returns {Promise<ReturnType<Provider.fromRow>|null>}
   */
  static async findByUserAndType(userId, providerTypeId) {
    const result = await query(
      "SELECT * FROM provider WHERE userid = $1 AND providertypeid = $2",
      [userId, providerTypeId],
    );
    const row = result.rows[0];
    return row ? Provider.fromRow(row) : null;
  }

  /**
   * @returns {Promise<ReturnType<Provider.fromRow>>}
   */
  static async createProvider({
    userId,
    providerTypeId,
    email,
    accessToken,
    refreshToken,
    expiresAt,
    scopes,
    salt,
    isActive = true,
  }) {
    const result = await query(
      `INSERT INTO provider (
         providertypeid,
         email,
         userid,
         createdat,
         updatedat,
         expiresat,
         accesstoken,
         scopes,
         salt,
         refreshtoken,
         isactive
       )
       VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        providerTypeId,
        email,
        userId,
        expiresAt,
        accessToken,
        scopes,
        salt,
        refreshToken,
        isActive,
      ],
    );
    return Provider.fromRow(result.rows[0]);
  }

  static async updateTokens(providerId, {
    accessToken,
    refreshToken,
    expiresAt,
    scopes,
    isActive = true,
  }) {
    await query(
      `UPDATE provider
       SET accesstoken = $2,
           refreshtoken = COALESCE($3, refreshtoken),
           expiresat = $4,
           scopes = COALESCE($5, scopes),
           isactive = $6,
           updatedat = NOW()
       WHERE providerid = $1`,
      [
        providerId,
        accessToken,
        refreshToken,
        expiresAt,
        scopes,
        isActive,
      ],
    );
  }
}
