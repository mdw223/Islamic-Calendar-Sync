import UserDOA from '../../model/db/doa/UserDOA.js';
import { signToken } from '../../Passport.js';

/**
 * POST /users/logout
 * Acknowledge logout. With JWT auth there is no server-side session; the client must discard the token.
 */
export async function Logout(req, res) {
    return res.json({
        success: true,
        message: 'Logged out successfully'
    });
}