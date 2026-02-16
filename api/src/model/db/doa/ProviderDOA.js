import { query } from "../../db/DBConnection.js";

/**
 * Data access layer for the PROVIDER table.
 * Matches the schema in the wiki (ProviderId, ProviderTypeId, Email, UserId, etc.).
 */
export default class ProviderDOA {
  static async findByUserAndType(userId, providerTypeId) {
    const result = await query(
      "SELECT * FROM provider WHERE userid = $1 AND providertypeid = $2",
      [userId, providerTypeId],
    );
    return result.rows[0] || null;
  }

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

    return result.rows[0];
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

