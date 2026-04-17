import UserDOA from '../../model/db/doa/UserDOA.js';
import { signToken } from '../../Passport.js';
import { authCookieConfig } from '../../Config.js';

/**
 * POST /users/logout
 * Clear the auth JWT cookie. With stateless JWT auth there is no server-side session to invalidate.
 */
export async function Logout(req, res) {
    res.clearCookie(authCookieConfig.NAME, authCookieConfig.OPTIONS);
    return res.json({
        success: true,
        message: 'Logged out successfully'
    });
}