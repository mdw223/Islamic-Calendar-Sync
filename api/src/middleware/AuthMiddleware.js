import jwt from 'jsonwebtoken';
import UserDAO from '../model/db/dao/UserDOA.js';

const userDao = new UserDAO();

export const SAME_USER = 'SAME_USER';
export const ADMIN = 'ADMIN';
export const ANY_USER = 'ANY_USER';

const authenticateUser = async (req, res, next) => {
  try {
    // Step 1: Get cookie from request
    const token = req.cookies?.token;
    
    if (!token) {
      throw new Error('No token provided');
    }

    // Step 2: Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 3: Extract user ID from JWT
    const userId = decoded.userId;

    // Step 4: Use DAO to get user from database
    const user = await userDao.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Step 5: Attach user to request object
    req.user = user;

    // Step 6: Call next() to proceed to next middleware or route handler
    next();

  } catch (error) {
    // TODO: add proper logging
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

export const Auth = (...allowedRoles) => {
  return [
    authenticateUser,
    (req, res, next) => {
      try {
        const user = req.user;
        const requestedUserId = req.params.userId;

        // Check each allowed role
        for (const role of allowedRoles) {
          if (role === ANY_USER) {
            // Any authenticated user is allowed
            return next();
          }
          
          if (role === ADMIN && user.role === 'admin') {
            // User is an admin
            return next();
          }
          
          if (role === SAME_USER && user.id === requestedUserId) {
            // User is accessing their own resource
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
  ];
};

export default Auth;