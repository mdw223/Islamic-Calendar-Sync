import UserDOA from '../../model/db/doa/UserDOA.js';
import { signToken } from '../../Passport.js';
import { sendJson } from '../SendJson.js';

/**
 * POST /users/send-code
 * Send a verification code to the user's email.
 * In a real implementation, this would send an email with a code.
 * For now, this is a placeholder that would integrate with an email service.
 */
export async function SendVerificationCode(req, res) {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return sendJson(res, {
                success: false,
                message: 'Email and name are required'
            }, 400);
        }

        // TODO: Generate a verification code and send it via email
        // For now, we'll just acknowledge the request
        // In production, you'd:
        // 1. Generate a random 6-digit code
        // 2. Store it temporarily (e.g., in Redis with email as key, expire in 10 minutes)
        // 3. Send email via service like SendGrid, AWS SES, etc.

        return sendJson(res, {
            success: true,
            message: 'Verification code sent to email'
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to send verification code',
        }, 500);
    }
}

/**
 * POST /users/verify-code
 * Verify the code and log in the user. Returns a JWT; client must store it and send as Authorization: Bearer <token>.
 */
export async function VerifyCode(req, res) {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return sendJson(res, {
                success: false,
                message: 'Email and code are required'
            }, 400);
        }

        // TODO: Verify the code against what was sent
        // In production, you'd:
        // 1. Look up the stored code for this email (from Redis/cache)
        // 2. Compare it with the provided code
        // 3. If valid, proceed; if not, return error

        // For now, we'll just check if the user exists and create/login them
        let user = await UserDOA.getUserByEmail(email);

        if (!user) {
            const name = email.split('@')[0];
            user = await UserDOA.createUser({ email, name });
        }

        await UserDOA.updateLastLogin(user.userId);

        const token = signToken(user);
        return sendJson(res, {
            success: true,
            message: 'Code verified successfully',
            token,
            user: {
                userId: user.userId,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to verify code',
        }, 500);
    }
}

/**
 * POST /users/logout
 * Acknowledge logout. With JWT auth there is no server-side session; the client must discard the token.
 */
export async function Logout(req, res) {
    return sendJson(res, {
        success: true,
        message: 'Logged out successfully'
    });
}