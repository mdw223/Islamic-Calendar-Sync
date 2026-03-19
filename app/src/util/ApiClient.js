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

  // ── Calendar Providers ─────────────────────────────────────────────────────

  /**
   * Get all calendar providers linked to the current user.
   */
  static async getCalendarProviders() {
    return HTTPClient.get("/calendar-providers");
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  /**
   * Get all events for the current user.
   */
  static async getEvents() {
    return HTTPClient.get("/events");
  }

  /**
   * Get a single event by ID.
   * @param {number} eventId
   */
  static async getEventById(eventId) {
    return HTTPClient.get(`/events/${eventId}`);
  }

  /**
   * Create a new event.
   * @param {{ name, startDate, endDate, isAllDay, description, hide, eventTypeId, isCustom, isTask }} eventData
   */
  static async createEvent(eventData) {
    const { eventId, ...payload } = eventData;
    return HTTPClient.post("/events", payload);
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

  /**
   * Delete all events for the current user.
   */
  static async deleteAllEvents() {
    return HTTPClient.delete("/events");
  }

  // ── Islamic event generation (server-side) ────────────────────────────────

  /**
   * Generate Islamic events for a Gregorian year on the backend.
   * The backend's upsert handles idempotency — calling this for the same
   * year is harmless.
   *
   * @param {number} year - Gregorian year, e.g. 2026
   * @returns {Promise<{ success: boolean, events: Object[], generatedCount: number }>}
   */
  static async generateEvents(year) {
    return HTTPClient.post("/events/generate", { year });
  }

  // ── Definitions ────────────────────────────────────────────────────────────

  /**
   * Get all Islamic event definitions with per-user isHidden preferences.
   * @returns {Promise<{ success: boolean, definitions: Object[] }>}
   */
  static async getDefinitions() {
    return HTTPClient.get("/definitions");
  }

  /**
   * Update the isHidden preference for a single definition.
   * Also updates the hide flag on all matching events server-side.
   *
   * @param {string} definitionId
   * @param {boolean} isHidden
   * @returns {Promise<{ success: boolean, definitionId: string, isHidden: boolean, eventsUpdated: number }>}
   */
  static async updateDefinitionPreference(definitionId, isHidden) {
    return HTTPClient.put(`/definitions/${definitionId}`, { isHidden });
  }

  // ── Offline → Server sync ─────────────────────────────────────────────────

  /**
   * Bulk-sync events from IndexedDB to the server.
   * Called once after login when offline guest data exists.
   *
   * @param {Array<Object>} events
   * @returns {Promise<{ success: boolean, syncedCount: number }>}
   */
  static async syncOfflineEvents(events) {
    return HTTPClient.post("/events/sync", { events });
  }

  /**
   * Bulk-sync definition preferences from IndexedDB to the server.
   *
   * @param {Array<{ definitionId: string, isHidden: boolean }>} preferences
   * @returns {Promise<{ success: boolean, syncedCount: number }>}
   */
  static async syncOfflinePreferences(preferences) {
    return HTTPClient.post("/definitions/sync", { preferences });
  }
}