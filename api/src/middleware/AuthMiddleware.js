import { AuthUser } from "../constants.js";

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
  const requestedUserId = req.params.userId;
  let requestedRoles = req.userRoles;

  let userRoles = AuthUser.ANY;
  if (user) {
    userRoles |= AuthUser.VALID_USER;
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
      AuthMiddleware(req, res, () => { // computes the scopes first
        try {

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
        res.status(403).json({
          success: false,
          message: 'Authorization failed',
        });
      }
      })
    }
};

export default Auth;
