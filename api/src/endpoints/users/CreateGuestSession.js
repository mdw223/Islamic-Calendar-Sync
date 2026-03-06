import crypto from "crypto";
import { getIronSession } from "iron-session";
import UserDOA from "../../model/db/doa/UserDOA.js";
import { sessionOptions } from "../../middleware/GuestSessionMiddleware.js";
import { generateForNewUser } from "../../services/IslamicEventService.js";
import { sendJson } from "../SendJson.js";

/**
 * POST /auth/guest
 *
 * Explicitly create a guest session. Called when the user clicks
 * "Continue as Guest" on the frontend login prompt.
 *
 * - If the request already has a valid guest session cookie, return the
 *   existing guest user (idempotent).
 * - Otherwise create a new guest user, write the session cookie, and return it.
 */
export default async function CreateGuestSession(req, res) {
  try {
    // If the user is already authenticated (JWT), no need for a guest session.
    if (req.user && !req.user.isGuest) {
      return sendJson(res, {
        success: false,
        message: "Already authenticated — guest session not needed.",
      }, 400);
    }

    // If the middleware already restored a guest user from an existing cookie,
    // just return that user (idempotent).
    if (req.user?.isGuest) {
      return sendJson(res, { success: true, user: req.user });
    }

    // Decrypt session cookie (may be empty if no cookie exists yet).
    const session = await getIronSession(req, res, sessionOptions);

    // Double-check: if a valid guest session ID exists in the cookie, look it up.
    if (session.guestSessionId) {
      const existing = await UserDOA.findBySessionId(session.guestSessionId);
      if (existing) {
        return sendJson(res, { success: true, user: existing });
      }
      // Stale session — destroy and recreate below.
      await session.destroy();
    }

    // Create a new guest user with a cryptographically random session ID.
    const sessionId = crypto.randomUUID();
    const user = await UserDOA.createGuestUser(sessionId);

    // Store the session ID in the encrypted cookie.
    session.guestSessionId = user.sessionId;
    await session.save();

    // Fire-and-forget: auto-generate Islamic events for the new guest so
    // their first GET /events already has events.
    generateForNewUser(user.userId).catch(() => {});

    return sendJson(res, { success: true, user: user }, 201);
  } catch (error) {
    return sendJson(res, {
      success: false,
      message: "Failed to create guest session.",
    }, 500);
  }
}
