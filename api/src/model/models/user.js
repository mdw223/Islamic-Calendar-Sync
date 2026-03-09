/**
 * User model. Maps DB rows (snake_case) to camelCase via fromRow.
 * Matches wiki USER entity (UserId, Email, Name, CreatedAt, etc.).
 */
export class User {
  constructor() {
    this.userId = null;
    this.email = null;
    this.name = null;
    this.createdAt = null;
    this.updatedAt = null;
    this.lastLogin = null;
    this.isAdmin = null;
    this.language = null;
    this.eventConfigurationStart = null;
    this.eventConfigurationEnd = null;
    this.prayerConfigurationStart = null;
    this.prayerConfigurationEnd = null;
    this.calculationMethodId = null;
    this.hanafi = null;
    this.salt = null;
    this.emailUpdates = null;
    this.notifications = null;
    this.authProviderTypeId = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.expiresAt = null;
    this.scopes = null;
    this.isExpired = null;
  }

  /**
   * @param {Record<string, any> | null} row - Raw pg row (snake_case keys)
   * @returns {User | null}
   */
  static fromRow(row) {
    if (row == null) return null;
    const user = new User();
    user.userId = row.userid;
    user.email = row.email;
    user.name = row.name;
    user.createdAt = row.createdat;
    user.updatedAt = row.updatedat;
    user.lastLogin = row.lastlogin;
    user.isAdmin = row.isadmin;
    user.language = row.language;
    user.eventConfigurationStart = row.eventconfigurationstart;
    user.eventConfigurationEnd = row.eventconfigurationend;
    user.prayerConfigurationStart = row.prayerconfigurationstart;
    user.prayerConfigurationEnd = row.prayerconfigurationend;
    user.calculationMethodId = row.calculationmethodid;
    user.hanafi = row.hanafi;
    user.salt = row.salt;
    user.emailUpdates = row.emailupdates;
    user.notifications = row.notifications;
    user.authProviderTypeId = row.authprovidertypeid;
    user.accessToken = row.accesstoken;
    user.refreshToken = row.refreshtoken;
    user.expiresAt = row.expiresat;
    user.scopes = row.scopes;
    user.isExpired = row.isexpired ?? true;
    return user;
  }

  toJSON() {
    return {
      userId: this.userId,
      email: this.email,
      name: this.name,
      isAdmin: this.isAdmin,
      language: this.language,
      eventConfigurationStart: this.eventConfigurationStart,
      eventConfigurationEnd: this.eventConfigurationEnd,
      prayerConfigurationStart: this.prayerConfigurationStart,
      prayerConfigurationEnd: this.prayerConfigurationEnd,
      calculationMethodId: this.calculationMethodId,
      hanafi: this.hanafi,
      emailUpdates: this.emailUpdates,
      notifications: this.notifications
    };
  }
}
