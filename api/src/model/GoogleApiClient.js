import ProviderDAO from "./db/dao/ProviderDOA.js";

/**
 * Orchestrates interactions between Google OAuth profile data
 * and our persistence layer (UserDAO, ProviderDAO).
 */
export default class GoogleAPIClient {

  /**
   * Update provider tokens (called from redirect handler after OAuth completes).
   * Used to update tokens separately if needed.
   *
   * @param {number} providerId - Provider ID from database
   * @param {Object} tokenData - { accessToken, refreshToken?, expiresAt, scopes? }
   */
  static async updateProviderTokens(providerId, tokenData) {
    await ProviderDAO.updateTokens(providerId, tokenData);
  }
}