/**
 * Provider model. Maps DB rows (snake_case) to camelCase via fromRow.
 * Matches wiki PROVIDER entity (ProviderId, ProviderTypeId, Email, UserId, etc.).
 */
export class Provider {
  constructor() {
    this.providerId = null;
    this.providerTypeId = null;
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
   * @returns {Provider | null}
   */
  static fromRow(row) {
    if (row == null) return null;
    const provider = new Provider();
    provider.providerId = row.providerid;
    provider.providerTypeId = row.providertypeid;
    provider.email = row.email;
    provider.userId = row.userid;
    provider.createdAt = row.createdat;
    provider.updatedAt = row.updatedat;
    provider.expiresAt = row.expiresat;
    provider.accessToken = row.accesstoken;
    provider.scopes = row.scopes;
    provider.salt = row.salt;
    provider.refreshToken = row.refreshtoken;
    provider.isActive = row.isactive;
    return provider;
  }
}
