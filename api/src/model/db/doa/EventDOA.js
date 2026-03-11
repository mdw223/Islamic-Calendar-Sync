import { query, getConnection } from "../../db/DBConnection.js";
import { Event } from "../../models/Event.js";

/**
 * Data access layer for the EVENT table.
 * Returns Event objects (camelCase) via Event.fromRow.
 * All write operations scope by userId to prevent cross-user tampering.
 */
export default class EventDOA {
  /**
   * Get all system events (IsSystemEvent = true).
   * @returns {Promise<Event[]>}
   */
  static async findAllSystemEvents() {
    const result = await query(
      "SELECT * FROM event WHERE issystemevent = TRUE ORDER BY eventid ASC"
    );
    return result.rows.map(Event.fromRow);
  }
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
    islamicDefinitionId = null,
  }) {
    const result = await query(
      `INSERT INTO event (
         userid, name, startdate, enddate, isallday,
         description, hide, eventtypeid, iscustom, istask,
         islamicdefinitionid, createdat, updatedat
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING *`,
      [userId, name, startDate, endDate, isAllDay, description, hide, eventTypeId, isCustom, isTask, islamicDefinitionId],
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
      islamicDefinitionId: "islamicdefinitionid",
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

  /**
   * Update the hide flag on all events matching a given Islamic definition ID
   * for a specific user. Used when toggling a definition's visibility.
   * @param {number} userId
   * @param {string} islamicDefinitionId
   * @param {boolean} hide
   * @returns {Promise<number>} Number of rows updated.
   */
  static async updateHideByDefinitionId(userId, islamicDefinitionId, hide) {
    const result = await query(
      `UPDATE event
       SET hide = $3, updatedat = NOW()
       WHERE userid = $1 AND islamicdefinitionid = $2`,
      [userId, islamicDefinitionId, hide],
    );
    return result.rowCount;
  }

  /**
   * Batch upsert events for a user inside a single transaction.
   *
   * For events that carry an `islamicEventKey`, the INSERT uses an ON CONFLICT
   * clause targeting the partial unique index on (UserId, IslamicEventKey).
   * This means re-syncing the same Islamic event from the frontend is safe —
   * the backend will simply update the existing row instead of duplicating it.
   *
   * For events without an `islamicEventKey`, a plain INSERT is performed.
   *
   * All events are processed inside a single database transaction so that the
   * batch either fully succeeds or fully rolls back.
   *
   * @param {Array<{ name: string, startDate: string, endDate: string,
   *   isAllDay?: boolean, description?: string, hide?: boolean,
   *   eventTypeId: number, isCustom?: boolean, isTask?: boolean,
   *   islamicEventKey?: string }>} eventsData
   * @param {number} userId
   * @returns {Promise<Event[]>} The persisted events, each with its integer eventId.
   */
  static async bulkUpsert(eventsData, userId) {
    const client = await getConnection();
    try {
      await client.query("BEGIN");

      const results = [];
      for (const data of eventsData) {
        const {
          name,
          startDate,
          endDate,
          isAllDay = false,
          description = null,
          hide = false,
          eventTypeId,
          isCustom = false,
          isTask = false,
          islamicEventKey = null,
          islamicDefinitionId = null,
        } = data;

        let result;

        if (islamicEventKey) {
          // Upsert: if a row for this (userId, islamicEventKey) already exists,
          // update all mutable fields. The EXCLUDED pseudo-table references the
          // values that were rejected by the conflict check.
          result = await client.query(
            `INSERT INTO event (
               userid, name, startdate, enddate, isallday,
               description, hide, eventtypeid, iscustom, istask,
               islamiceventkey, islamicdefinitionid, createdat, updatedat
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
             ON CONFLICT (userid, islamiceventkey)
               WHERE islamiceventkey IS NOT NULL
             DO UPDATE SET
               name                = EXCLUDED.name,
               startdate           = EXCLUDED.startdate,
               enddate             = EXCLUDED.enddate,
               isallday            = EXCLUDED.isallday,
               description         = EXCLUDED.description,
               hide                = EXCLUDED.hide,
               eventtypeid         = EXCLUDED.eventtypeid,
               iscustom            = EXCLUDED.iscustom,
               istask              = EXCLUDED.istask,
               islamicdefinitionid = EXCLUDED.islamicdefinitionid,
               updatedat           = NOW()
             RETURNING *`,
            [userId, name, startDate, endDate, isAllDay, description, hide,
             eventTypeId, isCustom, isTask, islamicEventKey, islamicDefinitionId],
          );
        } else {
          // Plain insert for regular user-created events.
          result = await client.query(
            `INSERT INTO event (
               userid, name, startdate, enddate, isallday,
               description, hide, eventtypeid, iscustom, istask,
               islamicdefinitionid, createdat, updatedat
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
             RETURNING *`,
            [userId, name, startDate, endDate, isAllDay, description, hide,
             eventTypeId, isCustom, isTask, islamicDefinitionId],
          );
        }

        if (result.rows[0]) {
          results.push(Event.fromRow(result.rows[0]));
        }
      }

      await client.query("COMMIT");
      return results;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      // Always release the connection back to the pool regardless of outcome.
      client.release();
    }
  }
}
