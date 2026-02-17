// import jwt from "jsonwebtoken";
// import { jwtSecret } from "../config.js";
// import UserDOA from "../model/db/doa/UserDOA.js";

// const authenticateUser = async (req, res, next) => {
//   try {
//     // Step 1: Get cookie from request
//     const token = req.cookies?.token;
//     console.log('[Auth] GET /users/me request received, cookie present:', !!token);

//     if (!token) {
//       throw new Error('No token provided');
//     }

//     // Step 2: Verify JWT
//     const decoded = jwt.verify(token, jwtSecret);

//     // Step 3: Extract user ID from JWT
//     const userId = decoded.userId;

//     // Step 4: Use DOA to get user from database
//     const user = await UserDOA.findById(userId);

//     if (!user) {
//       throw new Error('User not found');
//     }

//     // Step 5: Attach user to request object
//     req.user = user;

//     // Step 6: Call next() to proceed to next middleware or route handler
//     next();

//   } catch (error) {
//     console.log('[Auth] Authentication failed:', error.message);
//     res.status(401).json({

import AuthUser from '../model/models/constants/AuthUser';

/**
 * Ensure the request is authenticated via Passport session.
 * req.user is set by passport.session() / deserializeUser.
 */
const authenticateUser = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: 'Not authenticated'
    });
  }
  next();
};

export function AuthMiddleware(req, res, next) {
  const user = req.user;
  let userRoles = AuthUser.ANY_USER;
  if (user) {
    userRoles |= AuthUser.SUBSCRIBED_USER;
    if (user.isAdmin) {
      userRoles |= AuthUser.ADMIN;
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
      try {
        // Ensure AuthMiddleware has been called to set req.userRoles
        if (req.userRoles === undefined) {
          throw new Error('AuthMiddleware must be called before Auth');
        }

        const user = req.user;
        const requestedUserId = req.params.userId;
        let requestedRoles = req.userRoles;

        // Check if SAME_USER role should be granted
        // This is checked dynamically based on whether user is accessing their own resource
        if (user && requestedUserId) {
          const currentUserId = user.userId;
          const requestedUserIdNum = parseInt(requestedUserId);
          if (!isNaN(requestedUserIdNum) && currentUserId === requestedUserIdNum) {
            requestedRoles |= AuthUser.SAME_USER;
          }
        }

        if (Array.isArray(allowedRoles)) {
          for(const allowedRole of allowedRoles) {
            // ANY_USER (0) always matches
            if (allowedRole === AuthUser.ANY_USER) {
              return next();
            }
            if ((requestedRoles & allowedRole) === allowedRole) {
              return next();
            }
          }
        } else {
          // ANY_USER (0) always matches
          if (allowedRoles === AuthUser.ANY_USER) {
            return next();
          }
          if ((requestedRoles & allowedRoles) === allowedRoles) {
            return next();
          }
        }
        // No matching role found
        throw new Error('Insufficient permissions');

      } catch (error) {
        res.status(403).json({ // TODO: add better logging
          success: false,
          message: 'Authorization failed',
          error: error.message
        });
      }
    }
};

export default Auth;
