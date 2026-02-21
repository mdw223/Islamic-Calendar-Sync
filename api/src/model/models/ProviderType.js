/**
 * ProviderType entity. Maps PROVIDER_TYPE table (ProviderTypeId, Name).
 * For the ID enum (GOOGLE, MICROSOFT, etc.) see constants/ProviderType.js.
 */
export class ProviderType {
  constructor() {
    this.providerTypeId = null;
    this.name = null;
  }

  /**
   * @param {Record<string, any> | null} row - Raw pg row (snake_case keys)
   * @returns {ProviderType | null}
   */
  static fromRow(row) {
    if (row == null) return null;
    const providerType = new ProviderType();
    providerType.providerTypeId = row.providertypeid;
    providerType.name = row.name;
    return providerType;
  }
}
