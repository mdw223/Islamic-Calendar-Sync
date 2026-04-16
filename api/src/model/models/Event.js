/**
 * Event model. Maps DB rows (snake_case) to camelCase via fromRow.
 * Matches the EVENT table (EventId, Name, StartDate, EndDate, etc.).
 */
import { sanitizeDescription } from '../../util/SanitizeHtml.js';
export class Event {
  constructor() {
    this.eventId = null;
    this.name = null;
    this.location = null;
    this.startDate = null;
    this.endDate = null;
    this.isAllDay = null;
    this.description = null;
    this.hide = null;
    this.eventTypeId = null;
    this.isTask = null;
    this.islamicDefinitionId = null;
    this.hijriMonth = null;
    this.hijriDay = null;
    this.durationDays = null;
    this.rrule = null;
    this.eventTimezone = null;
    this.color = null;
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
    event.location = body.location ?? null;
    event.startDate = body.startDate ?? null;
    event.endDate = body.endDate ?? null;
    event.isAllDay = body.isAllDay ?? false;
    event.description = sanitizeDescription(body.description);
    event.eventTypeId = body.eventTypeId ?? null;
    event.isTask = body.isTask ?? false;
    event.islamicDefinitionId = body.islamicDefinitionId ?? null;
    event.hijriMonth = body.hijriMonth ?? null;
    event.hijriDay = body.hijriDay ?? null;
    event.durationDays = body.durationDays ?? null;
    event.rrule = body.rrule ?? null;
    event.eventTimezone = body.eventTimezone ?? null;
    event.color = body.color ?? null;
    event.hide = body.hide ?? false
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
    event.location = row.location ?? null;
    event.startDate = row.startdate;
    event.endDate = row.enddate;
    event.isAllDay = row.isallday;
    event.description = row.description;
    event.hide = row.hide;
    event.eventTypeId = row.eventtypeid;
    event.isTask = row.istask;
    event.islamicDefinitionId = row.islamicdefinitionid ?? null;
    event.hijriMonth = row.hijrimonth ?? null;
    event.hijriDay = row.hijriday ?? null;
    event.durationDays = row.durationdays ?? null;
    event.rrule = row.rrule ?? null;
    event.eventTimezone = row.eventtimezone ?? null;
    event.color = row.color ?? null;
    event.userId = row.userid;
    event.createdAt = row.createdat;
    event.updatedAt = row.updatedat;
    return event;
  }

  toJSON() {
    return {
      eventId: this.eventId,
      name: this.name,
      location: this.location,
      startDate: this.startDate,
      endDate: this.endDate,
      isAllDay: this.isAllDay,
      description: this.description,
      hide: this.hide,
      eventTypeId: this.eventTypeId,
      isTask: this.isTask,
      islamicDefinitionId: this.islamicDefinitionId,
      hijriMonth: this.hijriMonth,
      hijriDay: this.hijriDay,
      durationDays: this.durationDays,
      rrule: this.rrule,
      eventTimezone: this.eventTimezone,
      color: this.color,
      userId: this.userId,
    }
  }
}
