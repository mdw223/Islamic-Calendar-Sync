/**
 * CalendarProviderType entity. Maps CalendarProviderType table (CalendarProviderTypeId, Name).
 * For the ID enum (GOOGLE_CALENDAR, MICROSOFT_OUTLOOK, etc.) see Constants.js.
 */
export class CalendarProviderType {
  constructor() {
    this.calendarProviderTypeId = null;
    this.name = null;
  }

  /**
   * @param {Record<string, any> | null} row - Raw pg row (snake_case keys)
   * @returns {CalendarProviderType | null}
   */
  static fromRow(row) {
    if (row == null) return null;
    const calendarProviderType = new CalendarProviderType();
    calendarProviderType.calendarProviderTypeId = row.calendarprovidertypeid;
    calendarProviderType.name = row.name;
    return calendarProviderType;
  }
}
