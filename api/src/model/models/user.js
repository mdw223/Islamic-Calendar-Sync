/**
 * User model. Maps DB rows (snake_case) to camelCase via fromRow.
 * Matches wiki USERS entity (UserId, Email, Name, CreatedAt, etc.).
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
    return user;
  }
}
