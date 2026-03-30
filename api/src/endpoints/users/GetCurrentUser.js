import UserDOA from "../../model/db/doa/UserDOA.js";
import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";

/**
 * GET /users/me
 * Get the currently authenticated user.
 * The user is already attached to req.user by AuthMiddleware.
 */
export default async function GetCurrentUser(req, res) {
    try {
        const user = await UserDOA.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const authProviderName = await UserDOA.findAuthProviderName(req.user.userId);
        const userLocations = await UserLocationDOA.findAllByUserId(req.user.userId);

        return res.json({
            success: true,
            user: {
                ...user.toJSON(),
                authProviderName,
                userLocations,
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get current user',
        });
    }
}