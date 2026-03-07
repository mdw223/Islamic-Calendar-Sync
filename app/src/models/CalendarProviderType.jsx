/**
 * CalendarProviderType model aligned with DB schema (CalendarProviderType table).
 */
export function fromApiRow(row) {
  if (!row) return null;
  return {
    calendarProviderTypeId: row.calendarprovidertypeid ?? null,
    name: row.name ?? "",
  };
}

export const defaultCalendarProviderType = {
  calendarProviderTypeId: null,
  name: "",
};

export class CalendarProviderType {
  constructor(data = {}) {
    const normalized = data.calendarprovidertypeid != null ? fromApiRow(data) : { ...defaultCalendarProviderType, ...data };
    this.calendarProviderTypeId = normalized.calendarProviderTypeId ?? null;
    this.name = normalized.name ?? "";
  }

  toJSON() {
    return { calendarProviderTypeId: this.calendarProviderTypeId, name: this.name };
  }
}

export const createCalendarProviderType = (data = {}) => new CalendarProviderType(data);
