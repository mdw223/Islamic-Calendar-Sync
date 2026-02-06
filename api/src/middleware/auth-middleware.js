const authenticateUser = async (req, res, next) => {
  try {
    // Step 1: Get cookie from request
    const token = req.cookies?.token;
    
    if (!token) {
      throw new Error('No token provided');
    }

    // Step 2: Extract JWT from cookie
    // Token is already extracted from cookie above

    // Step 3: Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Step 4: Extract user ID from JWT
    const userId = decoded.userId;

    // Step 5: Use DAO to get user from database
    const user = await userDao.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Step 6: Attach user to request object
    req.user = user;

    // Step 7: Call next() to proceed to next middleware or route handler
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

module.exports = authenticateUser;
