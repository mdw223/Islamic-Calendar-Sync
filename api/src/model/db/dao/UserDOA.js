export default class UserDAO {
  constructor() {
    // Initialize database connection
  }

  /**
   * Get user by email address
   * @param {string} email - User's email address
   * @returns {Promise<Object|null>} - User object or null if not found
   * @throws {Error} - If database operation fails
   */
  static async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      DBConntection.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, results) => {
          if (err) {
            // TODO: use proper logging instead of throwing
            console.error("Database error:", err);
            reject(err);
            return;
          }

          // Return first user found or null
          resolve(results[0] || null);
        },
      );
    });
  }

  /**
   * Get user by ID
   * @param {number|string} userId - User ID
   * @returns {Promise<Object|null>} - User object or null if not found
   * @throws {Error} - If database operation fails
   */
  static async findById(userId) {
    return new Promise((resolve, reject) => {
      DBConntection.query(
        "SELECT * FROM users WHERE id = ?",
        [userId],
        (err, results) => {
          if (err) {
            console.error("Database error:", err);
            reject(err);
            return;
          }

          resolve(results[0] || null);
        },
      );
    });
  }

  /**
   * Create a new user
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} - Created user object
   * @throws {Error} - If database operation fails
   */
  static async createUser(userData) {
    return new Promise((resolve, reject) => {
      DBConntection.query(
        "INSERT INTO users SET ?",
        userData,
        (err, result) => {
          if (err) {
            console.error("Database error:", err);
            reject(err);
            return;
          }

          // Get the newly created user
          UserDAO.findById(result.insertId).then(resolve).catch(reject);
        },
      );
    });
  }

  /**
   * Update user data
   * @param {number|string} userId - User ID to update
   * @param {Object} userData - User data to update
   * @returns {Promise<Object|null>} - Updated user object or null if not found
   * @throws {Error} - If database operation fails
   */
  static async updateUser(userId, userData) {
    return new Promise((resolve, reject) => {
      DBConntection.query(
        "UPDATE users SET ? WHERE id = ?",
        [userData, userId],
        (err) => {
          if (err) {
            console.error("Database error:", err);
            reject(err);
            return;
          }

          // Return updated user
          UserDAO.findById(userId).then(resolve).catch(reject);
        },
      );
    });
  }

  /**
   * Delete user by ID
   * @param {number|string} userId - User ID to delete
   * @returns {Promise<boolean>} - True if user was deleted
   * @throws {Error} - If database operation fails
   */
  static async deleteUser(userId) {
    return new Promise((resolve, reject) => {
      DBConntection.query(
        "DELETE FROM users WHERE id = ?",
        [userId],
        (err, result) => {
          if (err) {
            console.error("Database error:", err);
            reject(err);
            return;
          }

          resolve(result.affectedRows > 0);
        },
      );
    });
  }
}
