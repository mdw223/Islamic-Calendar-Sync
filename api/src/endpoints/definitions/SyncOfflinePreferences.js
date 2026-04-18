/**
 * POST /definitions/sync
 *
 * Bulk-import Islamic event definition preferences from an offline guest's
 * IndexedDB into the authenticated user's server-side data.
 * Called once on login when local preference data exists.
 *
 * For each preference, upserts the UserIslamicDefinitionPreference row and
 * updates the `hide` flag on all matching events.
 *
 * Request body:
 *   { preferences: Array<{ definitionId: string, isHidden: boolean }> }
 *
 * Success response (200):
 *   { success: true, syncedCount: number }
 *
 * Error responses:
 *   400 — missing or invalid body
 *   500 — server error
 */
import IslamicDefinitionPreferenceDOA from "../../model/db/doa/IslamicDefinitionPreferenceDOA.js";
import EventDOA from "../../model/db/doa/EventDOA.js";
import { defaultLogger } from "../../middleware/logger.js";
export default async function SyncOfflinePreferences(req, res) {
  try {
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      return res.status(400).json({
        success: false,
        message: 'Request body must contain a "preferences" array.',
      });
    }

    if (preferences.length === 0) {
      return res.status(200).json({ success: true, syncedCount: 0 });
    }

    if (preferences.length > 200) {
      return res
        .status(400)
        .json({ success: false, message: "Too many preferences (max 200)." });
    }

    for (const p of preferences) {
      if (!p.definitionId || typeof p.isHidden !== "boolean") {
        return res.status(400).json({
          success: false,
          message:
            "Every preference must have definitionId (string) and isHidden (boolean).",
        });
      }
    }

    let synced = 0;
    for (const { definitionId, isHidden } of preferences) {
      await IslamicDefinitionPreferenceDOA.upsertPreference(
        req.user.userId,
        definitionId,
        isHidden,
      );
      await EventDOA.updateHideByDefinitionId(
        req.user.userId,
        definitionId,
        isHidden,
      );
      synced++;
    }

    return res.status(200).json({ success: true, syncedCount: synced });
  } catch (error) {
    defaultLogger.error("SyncOfflinePreferences error", { error, requestId: req.requestId, userId: req.user?.userId });
    return res
      .status(500)
      .json({ success: false, message: "Failed to sync offline preferences." });
  }
}
