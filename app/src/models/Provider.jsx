/**
 * Provider model aligned with DB schema (Provider table).
 * API would return lowercase column names; we use camelCase in the app.
 */
export function fromApiRow(row) {
  if (!row) return null;
  return {
    providerId: row.providerid ?? null,
    providerTypeId: row.providertypeid ?? null,
    name: row.name ?? null,
    email: row.email ?? null,
    userId: row.userid ?? null,
    createdAt: row.createdat ?? null,
    updatedAt: row.updatedat ?? null,
    expiresAt: row.expiresat ?? null,
    scopes: row.scopes ?? null,
    isActive: row.isactive ?? true,
  };
}

export const defaultProvider = {
  providerId: null,
  providerTypeId: null,
  name: null,
  email: null,
  userId: null,
  createdAt: null,
  updatedAt: null,
  expiresAt: null,
  scopes: null,
  isActive: true,
};

export class Provider {
  constructor(data = {}) {
    const normalized = data.providerid != null ? fromApiRow(data) : { ...defaultProvider, ...data };
    this.providerId = normalized.providerId ?? null;
    this.providerTypeId = normalized.providerTypeId ?? null;
    this.name = normalized.name ?? null;
    this.email = normalized.email ?? null;
    this.userId = normalized.userId ?? null;
    this.createdAt = normalized.createdAt ?? null;
    this.updatedAt = normalized.updatedAt ?? null;
    this.expiresAt = normalized.expiresAt ?? null;
    this.scopes = normalized.scopes ?? null;
    this.isActive = normalized.isActive ?? true;
  }

  toJSON() {
    return {
      providerId: this.providerId,
      providerTypeId: this.providerTypeId,
      name: this.name,
      email: this.email,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      expiresAt: this.expiresAt,
      scopes: this.scopes,
      isActive: this.isActive,
    };
  }
}

export const createProvider = (data = {}) => new Provider(data);
