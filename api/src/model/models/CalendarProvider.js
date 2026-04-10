/**
 * CalendarProvider model. Maps DB rows (snake_case) to camelCase via fromRow.
 * Matches wiki CalendarProvider entity (CalendarProviderId, CalendarProviderTypeId, Email, UserId, etc.).
 */
export class CalendarProvider {
  constructor() {
    this.calendarProviderId = null;
    this.calendarProviderTypeId = null;
    this.email = null;
    this.userId = null;
    this.createdAt = null;
    this.updatedAt = null;
    this.expiresAt = null;
    this.accessToken = null;
    this.scopes = null;
    this.salt = null;
    this.refreshToken = null;
    this.isActive = null;
  }

  /**
   * @param {Record<string, any> | null} row - Raw pg row (snake_case keys)
   * @returns {CalendarProvider | null}
   */
  static fromRow(row) {
    if (row == null) return null;
    const calendarProvider = new CalendarProvider();
    calendarProvider.calendarProviderId = row.calendarproviderid;
    calendarProvider.calendarProviderTypeId = row.calendarprovidertypeid;
    calendarProvider.email = row.email;
    calendarProvider.userId = row.userid;
    calendarProvider.createdAt = row.createdat;
    calendarProvider.updatedAt = row.updatedat;
    calendarProvider.expiresAt = row.expiresat;
    calendarProvider.accessToken = row.accesstoken;
    calendarProvider.scopes = row.scopes;
    calendarProvider.salt = row.salt;
    calendarProvider.refreshToken = row.refreshtoken;
    calendarProvider.isActive = row.isactive;
    return calendarProvider;
  }

  toJSON() {
    return {
      calendarProviderId: this.calendarProviderId,
      calendarProviderTypeId: this.calendarProviderTypeId,
      email: this.email,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      expiresAt: this.expiresAt,
      scopes: this.scopes,
      isActive: this.isActive
    };
  }
}
