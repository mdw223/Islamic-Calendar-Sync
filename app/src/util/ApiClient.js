import HTTPClient from "./HttpClient";
// this is like the .data layer interacting with the backend
// HTTPClient.baseURL already contains APP_API_URL (e.g. /api)

export default class APIClient {
  static ICS_FILE_NAME = "islamic-calendar.ics";

  static downloadBlob(blob, filename = APIClient.ICS_FILE_NAME) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get the currently authenticated user from the backend.
   * Sends stored JWT as Authorization: Bearer <token> when present.
   */
  static async getCurrentUser() {
    return HTTPClient.get("/users/me");
  }

  static async updateCurrentUser(updates) {
    return HTTPClient.put("/users/me", updates);
  }

  /**
   * Get the URL to initiate Google OAuth2 login via the backend.
   * Always targets /api/auth/google/login (required when behind a proxy that strips /api).
   */
  static getGoogleLoginUrl() {
    return `${HTTPClient.baseURL}/auth/google/login`;
  }

  /**
   * Request a magic-link email for login.
   * @param {string} email - User's email address
   */
  static async requestMagicLink(email) {
    return HTTPClient.post("/auth/magiclink/send", { email });
  }

  /**
   * Backward-compatible wrapper; magic-link flow does not require name.
   */
  static async sendVerificationCode(email) {
    return APIClient.requestMagicLink(email);
  }

  /**
   * Backward-compatible wrapper for magic-link flow.
   */
  static async verifyCode() {
    throw new Error("Verification codes are no longer used. Please use the magic link in your email.");
  }

  /**
   * Log out the current user. Call this then clear the stored token on the client.
   */
  static async logout() {
    return HTTPClient.post("/users/logout");
  }

  static async deleteAccount() {
    return HTTPClient.delete("/users/me");
  }

  // ── Calendar Providers ─────────────────────────────────────────────────────

  /**
   * Get all calendar providers linked to the current user.
   */
  static async getCalendarProviders() {
    return HTTPClient.get("/calendar-providers");
  }

  // ── Calendar subscription (opaque URL; manage in Manage Subscriptions) ─────

  static async getSubscriptionUrls() {
    return HTTPClient.get("/subscription/urls");
  }

  static async createSubscriptionUrl(payload = {}) {
    return HTTPClient.post("/subscription", payload);
  }

  static async updateSubscriptionUrl(subscriptionTokenId, payload = {}) {
    return HTTPClient.put(`/subscription/${subscriptionTokenId}`, payload);
  }

  static async revokeSubscription(subscriptionTokenId) {
    return HTTPClient.post("/subscription/revoke", { subscriptionTokenId });
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  /**
   * Get calendar events for the current user (expanded for the date range).
   * @param {{ from?: string, to?: string }} [query] — YYYY-MM-DD inclusive range; omit to use server defaults.
   */
  static async getEvents(query) {
    if (query?.from && query?.to) {
      const qs = new URLSearchParams({ from: query.from, to: query.to });
      return HTTPClient.get(`/events?${qs.toString()}`);
    }
    return HTTPClient.get("/events");
  }

  /**
   * Download events as .ics from the server.
   * Uses explicit years to support sparse year selection (e.g. 2025,2027).
   * @param {{ years?: number[], from?: string, to?: string }} [query]
   */
  static async downloadEventsIcs(query = {}) {
    const qs = new URLSearchParams();
    if (Array.isArray(query.years) && query.years.length > 0) {
      qs.set("years", query.years.join(","));
    } else if (query.from && query.to) {
      qs.set("from", query.from);
      qs.set("to", query.to);
    }
    if (typeof query.includeAll === "boolean") {
      qs.set("includeAll", String(query.includeAll));
    }

    const path = qs.toString() ? `/events.ics?${qs.toString()}` : "/events.ics";
    const response = await fetch(`${HTTPClient.baseURL}${path}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        const message = json?.message || `HTTP error! status: ${response.status}`;
        const err = new Error(message);
        err.status = response.status;
        throw err;
      } catch {
        const err = new Error(`HTTP error! status: ${response.status}`);
        err.status = response.status;
        throw err;
      }
    }

    const blob = await response.blob();
    APIClient.downloadBlob(blob);
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
   * @param {{ name, location?, startDate, endDate, isAllDay, description, hide, eventTypeId, isTask }} eventData
   */
  static async createEvent(eventData) {
    const { eventId, ...payload } = eventData;
    return HTTPClient.post("/events", payload);
  }

  /**
   * Update an existing event by its ID.
   * @param {number} eventId
   * @param {{ name?, location?, startDate?, endDate?, isAllDay?, description?, hide?, eventTypeId?, isTask? }} updates
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
   * Generate Islamic events for one or more Gregorian years on the backend.
   * The backend's upsert handles idempotency — calling this for the same
   * years is harmless.
   *
   * @param {number[]} years - Array of Gregorian years, e.g. [2025, 2026]
   * @returns {Promise<{ success: boolean, events: Object[], generatedCount: number }>}
   */
  static async generateEvents(years, timezone = null, includeAll = false) {
    return HTTPClient.post("/events/generate", { years, timezone, includeAll });
  }

  /**
   * Delete Islamic master rows for the given definition IDs only.
   * @param {string[]} definitionIds
   * @returns {Promise<{ success: boolean, deletedCount: number, generatedYearsStart: number | null, generatedYearsEnd: number | null }>}
   */
  static async resetIslamicEventsForDefinitions(definitionIds) {
    return HTTPClient.post("/events/islamic/reset", { definitionIds });
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

  static async getUserLocations() {
    return HTTPClient.get("/user-locations");
  }

  static async createUserLocation(userLocation) {
    return HTTPClient.post("/user-locations", userLocation);
  }

  static async updateUserLocation(userLocationId, updates) {
    return HTTPClient.put(`/user-locations/${userLocationId}`, updates);
  }

  static async deleteUserLocation(userLocationId) {
    return HTTPClient.delete(`/user-locations/${userLocationId}`);
  }

  static async syncOfflineUserLocations(userLocations) {
    return HTTPClient.post("/user-locations/sync", { userLocations });
  }
}