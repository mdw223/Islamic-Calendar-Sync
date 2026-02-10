import UserDAO from "./db/dao/UserDOA.js";
import ProviderDAO from "./db/dao/ProviderDOA.js";
import { ProviderTypeId } from "./models/ProviderType.js";

/**
 * Orchestrates interactions between Google OAuth profile data
 * and our persistence layer (UserDAO, ProviderDAO).
 */
export default class GoogleAPIClient {
  /**
   * Find or create a user and provider row based on a Google profile.
   * This is called from the Google Passport strategy, so it MUST NOT
   * talk to the database directly – it delegates to DAOs.
   *
   * @param {Object} profile - Google user profile from OAuth (contains email, name, etc.)
   * @param {Object} tokens - OAuth tokens: { access_token, refresh_token?, expires_in, scope }
   * @returns {Promise<{user: Object, provider: Object}>}
   */
  static async findOrCreateUserFromGoogleProfile(profile, tokens = null) {
    const email =
      profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const name = profile.displayName || email;

    if (!email) {
      throw new Error("Google profile did not include an email address");
    }

    // Find or create user
    let user = await UserDAO.getUserByEmail(email);

    if (!user) {
      user = await UserDAO.createUser({
        email,
        name,
      });
    }

    // Find or create provider row for this user and Google
    let provider = await ProviderDAO.findByUserAndType(
      user.userid,
      ProviderTypeId.GOOGLE,
    );

    // Calculate expiration time if tokens provided
    const expiresAt = tokens?.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    if (!provider) {
      // Create new provider with initial tokens if available
      provider = await ProviderDAO.createProvider({
        userId: user.userid,
        providerTypeId: ProviderTypeId.GOOGLE,
        email,
        accessToken: tokens?.access_token || null,
        refreshToken: tokens?.refresh_token || null,
        expiresAt: expiresAt,
        scopes: tokens?.scope || null,
        salt: null,
      });
    } else if (tokens) {
      // Update existing provider with new tokens
      // Preserve existing refresh token if new one not provided (Google only gives refresh token on first consent)
      await ProviderDAO.updateTokens(provider.providerid, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || provider.refreshtoken,
        expiresAt: expiresAt,
        scopes: tokens.scope || provider.scopes,
      });
      // Refresh provider data from database
      provider = await ProviderDAO.findByUserAndType(
        user.userid,
        ProviderTypeId.GOOGLE,
      );
    }

    // Update last login timestamp
    await UserDAO.updateLastLogin(user.userid);

    return { user, provider };
  }

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