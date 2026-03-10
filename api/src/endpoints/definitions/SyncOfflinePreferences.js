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
import { sendJson } from "../SendJson.js";

export default async function SyncOfflinePreferences(req, res) {
  try {
    const { preferences } = req.body;

    if (!Array.isArray(preferences)) {
      return sendJson(
        res,
        {
          success: false,
          message:
            'Request body must contain a "preferences" array.',
        },
        400,
      );
    }

    if (preferences.length === 0) {
      return sendJson(res, { success: true, syncedCount: 0 }, 200);
    }

    if (preferences.length > 200) {
      return sendJson(
        res,
        { success: false, message: "Too many preferences (max 200)." },
        400,
      );
    }

    for (const p of preferences) {
      if (!p.definitionId || typeof p.isHidden !== "boolean") {
        return sendJson(
          res,
          {
            success: false,
            message:
              "Every preference must have definitionId (string) and isHidden (boolean).",
          },
          400,
        );
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

    return sendJson(res, { success: true, syncedCount: synced }, 200);
  } catch (error) {
    console.error("SyncOfflinePreferences error:", error);
    return sendJson(
      res,
      { success: false, message: "Failed to sync offline preferences." },
      500,
    );
  }
}
