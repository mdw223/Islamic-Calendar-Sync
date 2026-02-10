import UserDAO from '../../model/db/dao/UserDOA.js';

/**
 * GET /users/me
 * Get the currently authenticated user.
 * The user is already attached to req.user by AuthMiddleware.
 */
export async function GetCurrentUser(req, res) {
    try {
        console.log('[GetCurrentUser] Handler reached, userId:', req.user?.userid);
        // req.user is already populated by AuthMiddleware, which calls UserDAO.findById
        // But we'll fetch it again to ensure we have the latest data
        const user = await UserDAO.findById(req.user.userid);

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

        const user = await UserDAO.findById(userId);

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