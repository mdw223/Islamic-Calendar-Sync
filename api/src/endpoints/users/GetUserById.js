import UserDOA from '../../model/db/doa/UserDOA.js';
import { sendJson } from '../SendJson.js';

/**
 * GET /users/:userId
 * Get a user by ID.
 * Only accessible by the user themselves or an admin (enforced by AuthMiddleware).
 */
export default async function GetUserById(req, res) {
    try {
        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            return sendJson(res, {
                success: false,
                message: 'Invalid user ID'
            }, 400);
        }

        const user = await UserDOA.findById(userId);

        if (!user) {
            return sendJson(res, {
                success: false,
                message: 'User not found'
            }, 404);
        }

        return sendJson(res, {
            success: true,
            user: user
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to get user',
        }, 500);
    }
}