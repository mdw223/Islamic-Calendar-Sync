import HTTPClient from "./HttpClient";
// this is like the .data layer interacting with the backend
// HTTPClient.baseURL already contains APP_API_URL (e.g. /api)

export default class APIClient {
  /**
   * Get the currently authenticated user from the backend.
   * Sends stored JWT as Authorization: Bearer <token> when present.
   */
  static async getCurrentUser() {
    return HTTPClient.get("/users/me");
  }

  /**
   * Get the URL to initiate Google OAuth2 login via the backend.
   * Always targets /api/auth/google/login (required when behind a proxy that strips /api).
   */
  static getGoogleLoginUrl() {
    return `${HTTPClient.baseURL}/auth/google/login`;
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
   * Returns { token, user }; store the token and send as Authorization: Bearer on subsequent requests.
   * @param {string} email - User's email address
   * @param {string} code - Verification code
   */
  static async verifyCode(email, code) {
    return HTTPClient.post("/users/verify-code", { email, code });
  }

  /**
   * Log out the current user. Call this then clear the stored token on the client.
   */
  static async logout() {
    return HTTPClient.post("/users/logout");
  }

  // ── Providers ──────────────────────────────────────────────────────────────

  /**
   * Get all calendar providers linked to the current user.
   */
  static async getProviders() {
    return HTTPClient.get("/providers");
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  /**
   * Get all events for the current user.
   */
  static async getEvents() {
    return HTTPClient.get("/events");
  }

  /**
   * Create a new event.
   * @param {{ name, startDate, endDate, isAllDay, description, hide, eventTypeId, isCustom, isTask }} eventData
   */
  static async createEvent(eventData) {
    return HTTPClient.post("/events", eventData);
  }

  /**
   * Update an existing event by its ID.
   * @param {number} eventId
   * @param {{ name?, startDate?, endDate?, isAllDay?, description?, hide?, eventTypeId?, isCustom?, isTask? }} updates
   */
  static async updateEvent(eventId, updates) {
    return HTTPClient.put(`/events/${eventId}`, updates);
  }

  /**
   * Delete an event by its ID.
   * @param {number} eventId
   */
  static async deleteEvent(eventId) {
    return HTTPClient.delete(`/events/${eventId}`);
  }
}