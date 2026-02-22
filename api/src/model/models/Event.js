/**
 * Event model. Maps DB rows (snake_case) to camelCase via fromRow.
 * Matches the EVENT table (EventId, Name, StartDate, EndDate, etc.).
 */
export class Event {
  constructor() {
    this.eventId = null;
    this.name = null;
    this.startDate = null;
    this.endDate = null;
    this.isAllDay = null;
    this.description = null;
    this.hide = null;
    this.eventTypeId = null;
    this.isCustom = null;
    this.isTask = null;
    this.userId = null;
    this.createdAt = null;
    this.updatedAt = null;
  }

  /**
   * Build an Event from a camelCase request body.
   * Only maps known fields; server-assigned fields (eventId, userId, createdAt, updatedAt) are ignored.
   * @param {Record<string, any>} body - req.body
   * @returns {Event}
   */
  static fromRequest(body) {
    const event = new Event();
    event.name = body.name ?? null;
    event.startDate = body.startDate ?? null;
    event.endDate = body.endDate ?? null;
    event.isAllDay = body.isAllDay ?? false;
    event.description = body.description ?? null;
    event.hide = body.hide ?? false;
    event.eventTypeId = body.eventTypeId ?? null;
    event.isCustom = body.isCustom ?? false;
    event.isTask = body.isTask ?? false;
    return event;
  }

  /**
   * @param {Record<string, any> | null} row - Raw pg row (snake_case keys)
   * @returns {Event | null}
   */
  static fromRow(row) {
    if (row == null) return null;
    const event = new Event();
    event.eventId = row.eventid;
    event.name = row.name;
    event.startDate = row.startdate;
    event.endDate = row.enddate;
    event.isAllDay = row.isallday;
    event.description = row.description;
    event.hide = row.hide;
    event.eventTypeId = row.eventtypeid;
    event.isCustom = row.iscustom;
    event.isTask = row.istask;
    event.userId = row.userid;
    event.createdAt = row.createdat;
    event.updatedAt = row.updatedat;
    return event;
  }
}
