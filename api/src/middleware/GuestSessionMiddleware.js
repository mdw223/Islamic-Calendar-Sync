import { getIronSession } from "iron-session";
import UserDOA from "../model/db/doa/UserDOA.js";
import { guestSessionConfig, appConfig } from "../Config.js";

const sessionOptions = {
  password: guestSessionConfig.SECRET, // Must be at least 32 characters — used for AES-256-CBC encryption and HMAC-SHA256 signing
  cookieName: guestSessionConfig.COOKIE_NAME,
  cookieOptions: {
    httpOnly: true, // Cookie is inaccessible to client-side JavaScript
    secure: appConfig.NODE_ENV === "production", // Only sent over HTTPS in production
    sameSite: "lax", // Prevents the cookie from being sent on cross-site requests
    maxAge: guestSessionConfig.COOKIE_MAX_AGE_MS / 1000, // iron-session expects seconds, not milliseconds
  },
};

export { sessionOptions };

/**
 * Guest session middleware.
 *
 * Runs AFTER optionalJwtAuth in the Express pipeline.
 * - If req.user is already set (JWT auth succeeded), skip.
 * - If a valid encrypted session cookie exists, look up the guest user by their
 *   random session ID and set req.user.
 * - Otherwise, proceed without req.user — guests are only created when the user
 *   explicitly chooses "Continue as Guest" via POST /auth/guest.
 */
export default async function guestSessionMiddleware(req, res, next) {
  try {
    // JWT auth already set the user — nothing to do.
    if (req.user) return next();

    // Decrypt and verify the session cookie using AES-256-CBC + HMAC-SHA256.
    // If the cookie is missing, tampered with, or expired, session will be empty ({}).
    // On success, writes the decrypted session data to the session object.
    const session = await getIronSession(req, res, sessionOptions);

    if (session.guestSessionId) {
      // A guest session exists — look up the user by their random opaque session ID.
      // This avoids exposing the user's primary key in the session and allows
      // individual sessions to be revoked by deleting the sessionId from the DB.
      const user = await UserDOA.findBySessionId(session.guestSessionId);
      if (user) {
        req.user = user;
        return next();
      }

      // Session ID not found in DB (e.g. session was revoked or user was deleted).
      // Destroy the stale cookie and fall through.
      await session.destroy();
    }

    // No valid session — proceed without req.user.
    // Guest sessions are created on-demand via POST /auth/guest.
    next();
  } catch (err) {
    // Don't block the request if guest session restore fails — proceed without req.user
    next();
  }
}