import EventDOA from '../../model/db/doa/EventDOA.js';

/**
 * POST /events/batch
 *
 * Batch upsert endpoint for Islamic calendar events (and optionally any other
 * events). The client sends an array of event objects; each event that carries
 * an `islamicEventKey` is upserted (insert-or-update) so that re-syncing the
 * same Islamic event is idempotent. Events without a key are plain inserts.
 *
 * All events are processed in a single transaction — either all succeed or
 * all are rolled back.
 *
 * Request body:
 *   { events: Array<{ name, startDate, endDate, eventTypeId, islamicEventKey?,
 *                     isAllDay?, description?, hide?, isCustom?, isTask? }> }
 *
 * Success response (201):
 *   { success: true, events: Event[] }  — each event has an integer eventId
 *
 * Error responses:
 *   400 — missing / invalid payload, or an event fails validation
 *   500 — database error
 */
export default async function BulkCreateEvents(req, res) {
  try {
    const { events } = req.body;

    // Validate that the payload is a non-empty array.
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain a non-empty "events" array.',
      });
    }

    // Validate each event before touching the database so we fail fast.
    for (let i = 0; i < events.length; i++) {
      const e = events[i];

      if (!e.name || !e.startDate || !e.endDate || !e.eventTypeId) {
        return res.status(400).json({
          success: false,
          message: `Event at index ${i} is missing required fields: name, startDate, endDate, eventTypeId.`,
        });
      }

      if (e.name.length > 1024) {
        return res.status(400).json({
          success: false,
          message: `Event at index ${i} has a name exceeding 1024 characters.`,
        });
      }
    }

    // Delegate to the DOA which runs the upserts inside a transaction.
    const created = await EventDOA.bulkUpsert(events, req.user.userId);

    return res.status(201).json({
      success: true,
      events: created,
    });
  } catch (error) {
    console.error('BulkCreateEvents error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to batch-create events.',
    });
  }
}
