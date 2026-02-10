import HTTPClient from "./HttpClient";
// this is like the .data layer interacting with the backend
// HTTPClient.baseURL already contains APP_API_URL (e.g. /api)

export default class APIClient {
  /**
   * Get the currently authenticated user from the backend.
   * Relies on the browser sending authentication cookies (e.g. JWT).
   */
  static async getCurrentUser() {
    return HTTPClient.get("/users/me");
  }

  /**
   * Get the URL to initiate Google OAuth2 login via the backend.
   * Always targets /api/auth/google/login (required when behind a proxy that strips /api).
   */
  static getGoogleLoginUrl() {
    const base = (HTTPClient.baseURL || "").replace(/\/+$/, "");
    const apiBase = base.endsWith("/api") ? base : `${base}/api`;
    return `${apiBase}/auth/google/login`;
  }

  /**
   * Send a verification code to the user's email.
   * @param {string} email - User's email address
   * @param {string} name - User's name
   */
  static async sendVerificationCode(email, name) {
    return HTTPClient.post("/users/send-code", { email, name });
  }

  /**
   * Verify the code and log in the user.
   * Sets a JWT cookie on success.
   * @param {string} email - User's email address
   * @param {string} code - Verification code
   */
  static async verifyCode(email, code) {
    return HTTPClient.post("/users/verify-code", { email, code });
  }

  /**
   * Log out the current user. Clears the session cookie on the server.
   * Call this before clearing local auth state.
   */
  static async logout() {
    return HTTPClient.post("/users/logout");
  }
}