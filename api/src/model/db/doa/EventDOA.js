import { query, getConnection } from "../../db/DBConnection.js";

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

   * @param {{ userId: number, name: string, location?: string, startDate: string, endDate: string,

   *           isAllDay?: boolean, description?: string, hide?: boolean,

   *           eventTypeId: number, isTask?: boolean }} data

   * @returns {Promise<Event>}

   */

  static async createEvent({

    userId,

    name,

    location = null,

    startDate,

    endDate,

    isAllDay = false,

    description = null,

    hide = false,

    eventTypeId,

    isTask = false,

    islamicDefinitionId = null,

    hijriMonth = null,

    hijriDay = null,

    durationDays = null,

    rrule = null,

    eventTimezone = null,

  }) {

    const result = await query(

      `INSERT INTO event (

         userid, name, startdate, enddate, isallday,

         description, location, hide, eventtypeid, istask,

         islamicdefinitionid, hijrimonth, hijriday, durationdays, rrule,

         eventtimezone, createdat, updatedat

       )

       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,

               $11, $12, $13, $14, $15, $16, NOW(), NOW())

       RETURNING *`,

      [userId, name, startDate, endDate, isAllDay, description, location, hide,

       eventTypeId, isTask, islamicDefinitionId, hijriMonth,

       hijriDay, durationDays, rrule, eventTimezone],

    );

    return Event.fromRow(result.rows[0]);

  }



  /**

   * Update an existing event. Only updates the provided fields.

   * Scopes by userId so a user cannot modify another user's events.

   * @param {number} eventId

   * @param {number} userId

   * @param {Partial<{ name, location, startDate, endDate, isAllDay, description, hide, eventTypeId, isTask }>} fields

   * @returns {Promise<Event | null>}

   */

  static async updateEvent(eventId, userId, fields) {

    const columnMap = {

      name: "name",

      location: "location",

      startDate: "startdate",

      endDate: "enddate",

      isAllDay: "isallday",

      description: "description",

      hide: "hide",

      eventTypeId: "eventtypeid",

      isTask: "istask",

      islamicDefinitionId: "islamicdefinitionid",

      hijriMonth: "hijrimonth",

      hijriDay: "hijriday",

      durationDays: "durationdays",

      rrule: "rrule",

      eventTimezone: "eventtimezone",

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

   * Delete all events for a user.

   * @param {number} userId

   * @returns {Promise<boolean>} true if any rows were deleted

   */

  static async deleteAllEvents(userId) {

    const result = await query(

      "DELETE FROM event WHERE userid = $1",

      [userId],

    );

    return result.rowCount > 0;

  }

  /**
   * Delete Islamic master rows for the given definition IDs (scoped to user).
   * @param {number} userId
   * @param {string[]} definitionIds
   * @returns {Promise<number>} Number of rows deleted.
   */
  static async deleteIslamicEventsForDefinitionIds(userId, definitionIds) {
    if (!definitionIds || definitionIds.length === 0) {
      return 0;
    }

    const result = await query(
      `DELETE FROM event
       WHERE userid = $1 AND islamicdefinitionid = ANY($2::text[])`,
      [userId, definitionIds],
    );

    return result.rowCount;
  }

  /**
   * Min/max Gregorian years from Islamic event master rows (remaining after deletes).
   * @param {number} userId
   * @returns {Promise<{ start: number, end: number } | null>}
   */
  static async getIslamicGeneratedYearBounds(userId) {
    const result = await query(
      `SELECT
         MIN(EXTRACT(YEAR FROM startdate::timestamp))::int AS min_y,
         MAX(EXTRACT(YEAR FROM startdate::timestamp))::int AS max_y
       FROM event
       WHERE userid = $1 AND islamicdefinitionid IS NOT NULL`,
      [userId],
    );

    const row = result.rows[0];
    if (!row || row.min_y == null || row.max_y == null) {
      return null;
    }

    return { start: row.min_y, end: row.max_y };
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
   * Islamic rows use ON CONFLICT per definition; other rows are plain inserts.
   */
  static async bulkUpsert(eventsData, userId) {
    const client = await getConnection();

    try {
      await client.query("BEGIN");

      const results = [];

      for (const data of eventsData) {
        if (data.islamicDefinitionId) {
          const row = await EventDOA._upsertIslamicMasterInClient(
            client,
            data,
            userId,
          );
          if (row) results.push(row);
          continue;
        }

        const {
          name,
          location = null,
          startDate,
          endDate,
          isAllDay = false,
          description = null,
          hide = false,
          eventTypeId,
          isTask = false,
          hijriMonth = null,
          hijriDay = null,
          durationDays = null,
          rrule = null,
          eventTimezone = null,
        } = data;

        const result = await client.query(
          `INSERT INTO event (
             userid, name, startdate, enddate, isallday,
             description, location, hide, eventtypeid, istask,
             islamicdefinitionid, hijrimonth, hijriday, durationdays, rrule, eventtimezone, createdat, updatedat
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
           RETURNING *`,
          [
            userId,
            name,
            startDate,
            endDate,
            isAllDay,
            description,
            location,
            hide,
            eventTypeId,
            isTask,
            null,
            hijriMonth,
            hijriDay,
            durationDays,
            rrule,
            eventTimezone,
          ],
        );

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
      client.release();
    }
  }

  static async _upsertIslamicMasterInClient(client, data, userId) {
    const {
      name,
      location = null,
      startDate,
      endDate,
      isAllDay = false,
      description = null,
      hide = false,
      eventTypeId,
      isTask = false,
      islamicDefinitionId,
      hijriMonth = null,
      hijriDay = null,
      durationDays = null,
      rrule = null,
      eventTimezone = null,
    } = data;

    const result = await client.query(
      `INSERT INTO event (
         userid, name, startdate, enddate, isallday,
         description, location, hide, eventtypeid, istask,
         islamicdefinitionid, hijrimonth, hijriday, durationdays, rrule, eventtimezone, createdat, updatedat
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
       ON CONFLICT (userid, islamicdefinitionid) WHERE islamicdefinitionid IS NOT NULL
       DO UPDATE SET
         name = EXCLUDED.name,
         startdate = EXCLUDED.startdate,
         enddate = EXCLUDED.enddate,
         isallday = EXCLUDED.isallday,
         description = EXCLUDED.description,
         location = EXCLUDED.location,
         hide = EXCLUDED.hide,
         eventtypeid = EXCLUDED.eventtypeid,
         istask = EXCLUDED.istask,
         hijrimonth = EXCLUDED.hijrimonth,
         hijriday = EXCLUDED.hijriday,
         durationdays = EXCLUDED.durationdays,
         rrule = EXCLUDED.rrule,
         eventtimezone = EXCLUDED.eventtimezone,
         updatedat = NOW()
       RETURNING *`,
      [
        userId,
        name,
        startDate,
        endDate,
        isAllDay,
        description,
        location,
        hide,
        eventTypeId,
        isTask,
        islamicDefinitionId,
        hijriMonth,
        hijriDay,
        durationDays,
        rrule,
        eventTimezone,
      ],
    );

    return result.rows[0] ? Event.fromRow(result.rows[0]) : null;
  }
}

