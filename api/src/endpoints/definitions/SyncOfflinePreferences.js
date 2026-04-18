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

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
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
      if (
        p.defaultColor != null &&
        (typeof p.defaultColor !== "string" || !HEX_COLOR_RE.test(p.defaultColor))
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Optional "defaultColor" must be a hex color string like #1A2B3C.',
        });
      }
    }

    let synced = 0;
    for (const { definitionId, isHidden, defaultColor } of preferences) {
      await IslamicDefinitionPreferenceDOA.upsertPreference(
        req.user.userId,
        definitionId,
        isHidden,
        defaultColor ?? null,
      );
      await EventDOA.updateHideByDefinitionId(
        req.user.userId,
        definitionId,
        isHidden,
      );
      if (defaultColor != null) {
        await EventDOA.updateColorByDefinitionId(
          req.user.userId,
          definitionId,
          defaultColor,
        );
      }
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
