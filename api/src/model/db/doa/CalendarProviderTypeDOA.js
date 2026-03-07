import { query } from "../../db/DBConnection.js";
import { CalendarProviderType } from "../../models/CalendarProviderType.js";

/**
 * DOA for the CalendarProviderType table.
 * Returns CalendarProviderType objects (camelCase) via CalendarProviderType.fromRow.
 */
export default class CalendarProviderTypeDOA {
  /**
   * @param {number} calendarProviderTypeId
   * @returns {Promise<ReturnType<CalendarProviderType.fromRow>|null>}
   */
  static async getById(calendarProviderTypeId) {
    const result = await query(
      "SELECT * FROM calendarprovidetype WHERE calendarprovidertypeid = $1",
      [calendarProviderTypeId],
    );
    const row = result.rows[0];
    return row ? CalendarProviderType.fromRow(row) : null;
  }

  /**
   * @param {string} name
   * @returns {Promise<ReturnType<CalendarProviderType.fromRow>|null>}
   */
  static async getByName(name) {
    const result = await query(
      "SELECT * FROM calendarprovidertype WHERE name = $1",
      [name],
    );
    const row = result.rows[0];
    return row ? CalendarProviderType.fromRow(row) : null;
  }
}
