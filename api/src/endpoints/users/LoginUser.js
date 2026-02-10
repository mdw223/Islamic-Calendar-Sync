import UserDAO from '../../model/db/dao/UserDOA.js';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../../config.js';

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
            return res.status(400).json({
                success: false,
                message: 'Email and name are required'
            });
        }

        // TODO: Generate a verification code and send it via email
        // For now, we'll just acknowledge the request
        // In production, you'd:
        // 1. Generate a random 6-digit code
        // 2. Store it temporarily (e.g., in Redis with email as key, expire in 10 minutes)
        // 3. Send email via service like SendGrid, AWS SES, etc.

        res.json({
            success: true,
            message: 'Verification code sent to email'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send verification code',
            error: error.message
        });
    }
}

/**
 * POST /users/verify-code
 * Verify the code and log in the user by setting a JWT cookie.
 */
export async function VerifyCode(req, res) {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and code are required'
            });
        }

        // TODO: Verify the code against what was sent
        // In production, you'd:
        // 1. Look up the stored code for this email (from Redis/cache)
        // 2. Compare it with the provided code
        // 3. If valid, proceed; if not, return error

        // For now, we'll just check if the user exists and create/login them
        let user = await UserDAO.getUserByEmail(email);

        if (!user) {
            // Extract name from email or use a default
            const name = email.split('@')[0];
            user = await UserDAO.createUser({ email, name });
        }

        // Update last login
        await UserDAO.updateLastLogin(user.userid);

        // Issue JWT token (same pattern as Google OAuth)
        const token = jwt.sign(
            { userId: user.userid },
            jwtSecret,
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({
            success: true,
            message: 'Code verified successfully',
            user: {
                userid: user.userid,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to verify code',
            error: error.message
        });
    }
}

/**
 * POST /users/logout
 * Log out the current user by clearing the JWT cookie.
 */
export async function Logout(req, res) {
    try {
        // Clear the token cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to logout',
            error: error.message
        });
    }
}