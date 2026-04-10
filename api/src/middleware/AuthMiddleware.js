import crypto from "crypto";
import { AuthUser } from "../Constants.js";
import UserDOA from "../model/db/doa/UserDOA.js";
import SubscriptionTokenDOA from "../model/db/doa/SubscriptionTokenDOA.js";
import jwt from "jsonwebtoken";
import {appConfig} from '../Config.js'

/**
 * Optional authentication middleware to use if I want to require authentication for a route and an explicit message to the user if they are not authenticated.
 * Ensure the request is authenticated (has valid JWT). req.user is set by optionalJwtAuth when a valid Bearer token is present.
 */
export function AuthenticateUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
  next();
};

export function AuthMiddleware(req, res, next) {

  const user = req.user;

  // SAME_USER is only resolved for routes that include a :userId param
  // (e.g. GET /users/:userId). For resource-based ownership (e.g. :eventId),
  // the handlers themselves scope DB queries by req.user.userId.
  const requestedUserId = req.params.userId;

  let userRoles = AuthUser.ANY;
  if (user) {
    userRoles |= AuthUser.VALID_USER;
    if (user.isAdmin) {
      userRoles |= AuthUser.ADMIN;
    }
    if (requestedUserId && user.userId == requestedUserId) {
      userRoles |= AuthUser.SAME_USER;
    }
  }

  req.userRoles = userRoles;
  next(); // Allows the next middleware method to run
}

/**
 * a factory that returns a middleware function that
 * performs bitwise operation to verify user roles
 * @param {*} allowedRoles 
 * @returns 
 */
export function Auth(allowedRoles) {
  return (req, res, next) => {
      AuthMiddleware(req, res, () => { // computes the scopes first
        try {

        if (Array.isArray(allowedRoles)) {
          for(const allowedRole of allowedRoles) {
            // ANY (0) always matches
            if (allowedRole === AuthUser.ANY) {
              return next();
            }
            if ((req.userRoles & allowedRole) === allowedRole) {
              return next();
            }
          }
        } else {
          // ANY (0) always matches
          if (allowedRoles === AuthUser.ANY) {
            return next();
          }
          if ((req.userRoles & allowedRoles) === allowedRoles) {
            return next();
          }
        }
        // No matching role found
        throw new Error('Insufficient permissions');

      } catch (error) {
        res.status(403).json({
          success: false,
          message: 'Authorization failed',
        });
      }
      })
    }
};

/**
 * GET /subscription/events?token=<opaque hex>: hash token, load user, reject if missing/revoked.
 */
export async function RequireSubscriptionToken(req, res, next) {
  try {
    const token = req.query.token;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const decoded = jwt.decode(token);
    const userId = decoded?.userId;
    if (!userId) {
      return res.status(403).json({ success: false, message: "Invalid or revoked token" });
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token, "utf8")
      .digest("hex");
    const subscription = await SubscriptionTokenDOA.findActiveByUserIdAndHash(
      userId,
      tokenHash,
    );
    if (!subscription) {
      return res.status(403).json({ success: false, message: "Invalid or revoked token" });
    }

    const tokenSecret = appConfig.API_SECRET + subscription.salt;
    const verified = jwt.verify(token, tokenSecret);
    if (!verified?.userId || verified.userId !== userId) {
      return res.status(403).json({ success: false, message: "Invalid or revoked token" });
    }

    const user = await UserDOA.findById(verified.userId);
    if (!user) {
      return res.status(403).json({ success: false, message: "Invalid or revoked token" });
    }

    req.user = user;
    req.subscriptionToken = subscription;
    return next();
  } catch {
    return res.status(403).json({ success: false, message: "Invalid or revoked token" });
  }
}

export function GenerateToken(user, salt) {
  const tokenSecret = appConfig.API_SECRET + salt;
  return jwt.sign({ userId: user.userId }, tokenSecret);
}


export default Auth;
