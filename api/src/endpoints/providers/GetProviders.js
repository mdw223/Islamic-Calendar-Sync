import ProviderDOA from '../../model/db/doa/ProviderDOA.js';

/**
 * GET /providers
 * Get all calendar providers linked to the current user.
 * Sensitive token/salt fields are stripped before returning.
 */
export default async function GetProviders(req, res) {
    try {
        const providers = await ProviderDOA.findAllByUserId(req.user.userId);

        const safeProviders = providers.map(({ accessToken, refreshToken, salt, ...rest }) => rest);

        res.json({
            success: true,
            providers: safeProviders,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get providers',
        });
    }
}
