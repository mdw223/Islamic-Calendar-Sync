import { query } from "../../db/DBConnection.js";
import { Event } from "../../models/Event.js";

/**
 * Data access layer for the EVENT table.
 * Returns Event objects (camelCase) via Event.fromRow.
 * All write operations scope by userId to prevent cross-user tampering.
 */
export default class EventDOA {
  /**
   * Get a single event by ID, scoped to the owning user.
   * @param {number} eventId
   * @param {number} userId
   * @returns {Promise<Event | null>}
   */
  static async findById(eventId, userId) {
    const result = await query(
      "SELECT * FROM event WHERE eventid = $1 AND userid = $2",
      [eventId, userId],
    );
    return result.rows[0] ? Event.fromRow(result.rows[0]) : null;
  }

  /**
   * Get all events belonging to a user.
   * @param {number} userId
   * @returns {Promise<Event[]>}
   */
  static async findAllByUserId(userId) {
    const result = await query(
      "SELECT * FROM event WHERE userid = $1 ORDER BY startdate ASC",
      [userId],
    );
    return result.rows.map(Event.fromRow);
  }

  /**
   * Create a new event for a user.
   * @param {{ userId: number, name: string, startDate: string, endDate: string,
   *           isAllDay?: boolean, description?: string, hide?: boolean,
   *           eventTypeId: number, isCustom?: boolean, isTask?: boolean }} data
   * @returns {Promise<Event>}
   */
  static async createEvent({
    userId,
    name,
    startDate,
    endDate,
    isAllDay = false,
    description = null,
    hide = false,
    eventTypeId,
    isCustom = false,
    isTask = false,
  }) {
    const result = await query(
      `INSERT INTO event (
         userid, name, startdate, enddate, isallday,
         description, hide, eventtypeid, iscustom, istask,
         createdat, updatedat
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [userId, name, startDate, endDate, isAllDay, description, hide, eventTypeId, isCustom, isTask],
    );
    return Event.fromRow(result.rows[0]);
  }

  /**
   * Update an existing event. Only updates the provided fields.
   * Scopes by userId so a user cannot modify another user's events.
   * @param {number} eventId
   * @param {number} userId
   * @param {Partial<{ name, startDate, endDate, isAllDay, description, hide, eventTypeId, isCustom, isTask }>} fields
   * @returns {Promise<Event | null>}
   */
  static async updateEvent(eventId, userId, fields) {
    const columnMap = {
      name: "name",
      startDate: "startdate",
      endDate: "enddate",
      isAllDay: "isallday",
      description: "description",
      hide: "hide",
      eventTypeId: "eventtypeid",
      isCustom: "iscustom",
      isTask: "istask",
    };

    const entries = Object.entries(fields).filter(([k]) => columnMap[k] !== undefined);

    if (entries.length === 0) {
      throw new Error("No valid fields provided for update");
    }

    const setClauses = entries.map(([k], i) => `${columnMap[k]} = $${i + 3}`);
    const values = entries.map(([, v]) => v);

    const result = await query(
      `UPDATE event
       SET ${setClauses.join(", ")}, updatedat = NOW()
       WHERE eventid = $1 AND userid = $2
       RETURNING *`,
      [eventId, userId, ...values],
    );

    return result.rows[0] ? Event.fromRow(result.rows[0]) : null;
  }

  /**
   * Delete an event by ID, scoped to the owning user.
   * @param {number} eventId
   * @param {number} userId
   * @returns {Promise<boolean>} true if a row was deleted
   */
  static async deleteEvent(eventId, userId) {
    const result = await query(
      "DELETE FROM event WHERE eventid = $1 AND userid = $2",
      [eventId, userId],
    );
    return result.rowCount > 0;
  }
}
