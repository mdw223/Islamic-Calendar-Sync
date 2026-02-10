import { query } from "../../db/DBConnection.js";

/**
 * DAO for the PROVIDER_TYPE table (ProviderTypeId, Name).
 */
export default class ProviderTypeDAO {
  static async getById(providerTypeId) {
    const result = await query(
      "SELECT * FROM provider_type WHERE providertypeid = $1",
      [providerTypeId],
    );
    return result.rows[0] || null;
  }

  static async getByName(name) {
    const result = await query(
      "SELECT * FROM provider_type WHERE name = $1",
      [name],
    );
    return result.rows[0] || null;
  }
}

