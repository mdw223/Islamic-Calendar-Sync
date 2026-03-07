/**
 * CalendarProvider model aligned with DB schema (CalendarProvider table).
 * API would return lowercase column names; we use camelCase in the app.
 */
export function fromApiRow(row) {
  if (!row) return null;
  return {
    calendarProviderId: row.calendarproviderid ?? null,
    calendarProviderTypeId: row.calendarprovidertypeid ?? null,
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

export const defaultCalendarProvider = {
  calendarProviderId: null,
  calendarProviderTypeId: null,
  name: null,
  email: null,
  userId: null,
  createdAt: null,
  updatedAt: null,
  expiresAt: null,
  scopes: null,
  isActive: true,
};

export class CalendarProvider {
  constructor(data = {}) {
    const normalized = data.calendarproviderid != null ? fromApiRow(data) : { ...defaultCalendarProvider, ...data };
    this.calendarProviderId = normalized.calendarProviderId ?? null;
    this.calendarProviderTypeId = normalized.calendarProviderTypeId ?? null;
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
      calendarProviderId: this.calendarProviderId,
      calendarProviderTypeId: this.calendarProviderTypeId,
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

export const createCalendarProvider = (data = {}) => new CalendarProvider(data);
