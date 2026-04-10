import UserDOA from '../../model/db/doa/UserDOA.js';
/**
 * GET /users/:userId
 * Get a user by ID.
 * Only accessible by the user themselves or an admin (enforced by AuthMiddleware).
 */
export default async function GetUserById(req, res) {
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

        return res.json({
            success: true,
            user: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get user',
        });
    }
}