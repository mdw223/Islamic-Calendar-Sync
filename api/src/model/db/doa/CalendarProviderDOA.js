import { query } from "../../db/DBConnection.js";
import { CalendarProvider } from "../../models/CalendarProvider.js";

/**
 * Data access layer for the CalendarProvider table.
 * Returns CalendarProvider objects (camelCase) via CalendarProvider.fromRow.
 */
export default class CalendarProviderDOA {
  /**
   * Get all calendar providers for a user.
   * @param {number} userId
   * @returns {Promise<CalendarProvider[]>}
   */
  static async findAllByUserId(userId) {
    const result = await query(
      "SELECT * FROM calendarprovider WHERE userid = $1 ORDER BY createdat ASC",
      [userId],
    );
    return result.rows.map(CalendarProvider.fromRow);
  }

  /**
   * @param {number} userId
   * @param {number} calendarProviderTypeId
   * @returns {Promise<ReturnType<CalendarProvider.fromRow>|null>}
   */
  static async findByUserAndType(userId, calendarProviderTypeId) {
    const result = await query(
      "SELECT * FROM calendarprovider WHERE userid = $1 AND calendarprovidertypeid = $2",
      [userId, calendarProviderTypeId],
    );
    const row = result.rows[0];
    return row ? CalendarProvider.fromRow(row) : null;
  }

  /**
   * @returns {Promise<ReturnType<CalendarProvider.fromRow>>}
   */
  static async createCalendarProvider({
    userId,
    calendarProviderTypeId,
    email,
    accessToken,
    refreshToken,
    expiresAt,
    scopes,
    salt,
    isActive = true,
  }) {
    const result = await query(
      `INSERT INTO calendarprovider (
         calendarprovidertypeid,
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
        calendarProviderTypeId,
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
    return CalendarProvider.fromRow(result.rows[0]);
  }

  static async updateTokens(calendarProviderId, {
    accessToken,
    refreshToken,
    expiresAt,
    scopes,
    isActive = true,
  }) {
    await query(
      `UPDATE calendarprovider
       SET accesstoken = $2,
           refreshtoken = COALESCE($3, refreshtoken),
           expiresat = $4,
           scopes = COALESCE($5, scopes),
           isactive = $6,
           updatedat = NOW()
       WHERE calendarproviderid = $1`,
      [
        calendarProviderId,
        accessToken,
        refreshToken,
        expiresAt,
        scopes,
        isActive,
      ],
    );
  }
}
