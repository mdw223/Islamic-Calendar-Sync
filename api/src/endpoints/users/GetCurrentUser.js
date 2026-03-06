import { sendJson } from '../SendJson.js';

/**
 * GET /users/me
 * Get the currently authenticated user.
 * The user is already attached to req.user by AuthMiddleware.
 */
export default async function GetCurrentUser(req, res) {
    try {
        const user = req.user;
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
            message: 'Failed to get current user',
        }, 500);
    }
}