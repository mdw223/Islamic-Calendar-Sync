import UserDOA from '../../model/db/doa/UserDOA.js';
import ProviderDOA from '../../model/db/doa/ProviderDOA.js';

/**
 * GET /users/me
 * Get the currently authenticated user.
 * The user is already attached to req.user by AuthMiddleware.
 */
export default async function GetCurrentUser(req, res) {
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