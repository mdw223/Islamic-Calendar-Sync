/**
 * POST /events/sync
 *
 * Bulk-import events from an offline guest's IndexedDB into the authenticated
 * user's server-side data.  Called once on login when local data exists.
 *
 * - Islamic events (those with an `islamicEventKey`) are upserted via
 *   EventDOA.bulkUpsert — the backend's partial unique index on
 *   (UserId, IslamicEventKey) prevents duplicates.
 * - Custom events (no `islamicEventKey`) are inserted as new rows.
 *
 * Request body:
 *   { events: Array<{ name, startDate, endDate, isAllDay, description,
 *       hide, eventTypeId, isCustom, isTask, islamicEventKey?,
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
import { sendJson } from "../SendJson.js";

export default async function SyncOfflineEvents(req, res) {
  try {
    const { events } = req.body;

    if (!Array.isArray(events)) {
      return sendJson(
        res,
        {
          success: false,
          message:
            'Request body must contain an "events" array.',
        },
        400,
      );
    }

    if (events.length === 0) {
      return sendJson(res, { success: true, syncedCount: 0 }, 200);
    }

    // Cap at a reasonable limit to prevent abuse.
    if (events.length > 2000) {
      return sendJson(
        res,
        { success: false, message: "Too many events (max 2000)." },
        400,
      );
    }

    // Validate each event minimally.
    for (const e of events) {
      if (!e.name || !e.startDate || !e.endDate || !e.eventTypeId) {
        return sendJson(
          res,
          {
            success: false,
            message:
              "Every event must have name, startDate, endDate, and eventTypeId.",
          },
          400,
        );
      }
    }

    const persisted = await EventDOA.bulkUpsert(events, req.user.userId);

    return sendJson(
      res,
      { success: true, syncedCount: persisted.length },
      201,
    );
  } catch (error) {
    console.error("SyncOfflineEvents error:", error);
    return sendJson(
      res,
      { success: false, message: "Failed to sync offline events." },
      500,
    );
  }
}
