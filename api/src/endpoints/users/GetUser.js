import UserDOA from '../../model/db/doa/UserDOA.js';
import ProviderDOA from '../../model/db/doa/ProviderDOA.js';
import { ProviderTypeId } from '../../model/models/constants/ProviderType.js';

/**
 * GET /users/me
 * Get the currently authenticated user.
 * The user is already attached to req.user by AuthMiddleware.
 */
export async function GetCurrentUser(req, res) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return user data (excluding sensitive fields like salt)
        const { salt, ...userData } = user;

        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get current user',
            error: error.message
        });
    }
}

/**
 * GET /users/:userId
 * Get a user by ID.
 * Only accessible by the user themselves or an admin (enforced by AuthMiddleware).
 */
export async function GetUserById(req, res) {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const user = await UserDOA.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Return user data (excluding sensitive fields like salt)
        const { salt, ...userData } = user;

        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
}

/**
   * Find or create a user and provider row based on a Google profile.
   * This is called from the Google Passport strategy, so it MUST NOT
   * talk to the database directly – it delegates to DOAs.
   *
   * @param {Object} profile - Google user profile from OAuth (contains email, name, etc.)
   * @param {Object} tokens - OAuth tokens: { access_token, refresh_token?, expires_in, scope }
   * @returns {Promise<{user: Object, provider: Object}>}
   */
export async function findOrCreateUserFromGoogleProfile(profile, tokens = null) {
    const email =
        profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    const name = profile.displayName || email;

    if (!email) {
        throw new Error("Google profile did not include an email address");
    }

    // Find or create user
    let user = await UserDOA.getUserByEmail(email);

    if (!user) {
        user = await UserDOA.createUser({
            email,
            name,
        });
    }

    // Find or create provider row for this user and Google
    let provider = await ProviderDOA.findByUserAndType(
        user.userId,
        ProviderTypeId.GOOGLE,
    );

    // Calculate expiration time if tokens provided
    const expiresAt = tokens?.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000)
        : null;

    if (!provider) {
        // Create new provider with initial tokens if available
        provider = await ProviderDOA.createProvider({
            userId: user.userId,
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
        await ProviderDOA.updateTokens(provider.providerId, {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || provider.refreshToken,
            expiresAt: expiresAt,
            scopes: tokens.scope || provider.scopes,
        });
        // Refresh provider data from database
        provider = await ProviderDOA.findByUserAndType(
            user.userId,
            ProviderTypeId.GOOGLE,
        );
    }

    // Update last login timestamp
    await UserDOA.updateLastLogin(user.userId);

    return { user, provider };
}