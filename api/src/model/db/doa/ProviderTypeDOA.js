import { query } from "../../db/DBConnection.js";
import { ProviderType } from "../../models/ProviderType.js";

/**
 * DOA for the PROVIDER_TYPE table.
 * Returns ProviderType objects (camelCase) via ProviderType.fromRow.
 */
export default class ProviderTypeDOA {
  /**
   * @param {number} providerTypeId
   * @returns {Promise<ReturnType<ProviderType.fromRow>|null>}
   */
  static async getById(providerTypeId) {
    const result = await query(
      "SELECT * FROM provider_type WHERE providertypeid = $1",
      [providerTypeId],
    );
    const row = result.rows[0];
    return row ? ProviderType.fromRow(row) : null;
  }

  /**
   * @param {string} name
   * @returns {Promise<ReturnType<ProviderType.fromRow>|null>}
   */
  static async getByName(name) {
    const result = await query(
      "SELECT * FROM provider_type WHERE name = $1",
      [name],
    );
    const row = result.rows[0];
    return row ? ProviderType.fromRow(row) : null;
  }
}
