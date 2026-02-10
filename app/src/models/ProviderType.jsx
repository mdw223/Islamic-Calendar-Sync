/**
 * ProviderType model aligned with DB schema (ProviderType table).
 */
export function fromApiRow(row) {
  if (!row) return null;
  return {
    providerTypeId: row.providertypeid ?? null,
    name: row.name ?? "",
  };
}

export const defaultProviderType = {
  providerTypeId: null,
  name: "",
};

export class ProviderType {
  constructor(data = {}) {
    const normalized = data.providertypeid != null ? fromApiRow(data) : { ...defaultProviderType, ...data };
    this.providerTypeId = normalized.providerTypeId ?? null;
    this.name = normalized.name ?? "";
  }

  toJSON() {
    return { providerTypeId: this.providerTypeId, name: this.name };
  }
}

export const createProviderType = (data = {}) => new ProviderType(data);
