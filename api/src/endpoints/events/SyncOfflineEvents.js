/**
 * POST /events/sync
 *
 * Bulk-import events from an offline guest's IndexedDB into the authenticated
 * user's server-side data.  Called once on login when local data exists.
 *
 * - Islamic events are upserted via EventDOA.bulkUpsert (one master row per definition; partial unique index on userid + islamicdefinitionid).
 * - Custom events are inserted as new rows.
 *
 * Request body:
 *   { events: Array<{ name, startDate, endDate, isAllDay, description,
 *       hide, eventTypeId, isTask, islamicDefinitionId?
 *       islamicDefinitionId? }> }
 *
 * Success response (201):
 *   { success: true, syncedCount: number }
 *
 * Error responses:
 *   400 — missing or invalid body
 *   500 — server error
 */
import EventDOA from "../../model/db/doa/EventDOA.js";
import { defaultLogger } from "../../middleware/logger.js";
import { sanitizeDescription } from "../../util/sanitizeHtml.js";
export default async function SyncOfflineEvents(req, res) {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain an "events" array.',
      });
    }

    if (events.length === 0) {
      return res.status(200).json({ success: true, syncedCount: 0 });
    }

    // Cap at a reasonable limit to prevent abuse.
    if (events.length > 2000) {
      return res
        .status(400)
        .json({ success: false, message: "Too many events (max 2000)." });
    }

    // Validate each event minimally and sanitize HTML fields.
    for (const e of events) {
      if (!e.name || !e.startDate || !e.endDate || !e.eventTypeId) {
        return res.status(400).json({
          success: false,
          message:
            "Every event must have name, startDate, endDate, and eventTypeId.",
        });
      }
      e.description = sanitizeDescription(e.description);
    }

    const persisted = await EventDOA.bulkUpsert(events, req.user.userId);

    return res.status(201).json({ success: true, syncedCount: persisted.length });
  } catch (error) {
    defaultLogger.error("SyncOfflineEvents error", { error, requestId: req.requestId, userId: req.user?.userId });
    return res
      .status(500)
      .json({ success: false, message: "Failed to sync offline events." });
  }
}
