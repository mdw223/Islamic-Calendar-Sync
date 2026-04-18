/**
 * PUT /definitions/:definitionId
 *
 * Toggle the isHidden flag for a specific Islamic event definition.
 * Also updates the `hide` flag on all matching events in the database
 * in a single UPDATE statement (replacing the frontend's loop of individual
 * PUT /events/:id calls).
 *
 * Request body:
 *   { isHidden: boolean }
 *
 * Success response (200):
 *   { success: true, definitionId, isHidden, eventsUpdated: number }
 *
 * Error responses:
 *   400 — missing or invalid isHidden
 *   500 — server error
 */
import IslamicDefinitionPreferenceDOA from "../../model/db/doa/IslamicDefinitionPreferenceDOA.js";
import EventDOA from "../../model/db/doa/EventDOA.js";
import { defaultLogger } from "../../middleware/logger.js";

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
export default async function UpdateDefinitionPreference(req, res) {
  try {
    const { definitionId } = req.params;
    const { isHidden, defaultColor } = req.body;

    if (typeof isHidden !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Request body must contain \"isHidden\" as a boolean.",
      });
    }

    if (
      defaultColor != null &&
      (typeof defaultColor !== "string" || !HEX_COLOR_RE.test(defaultColor))
    ) {
      return res.status(400).json({
        success: false,
        message: '"defaultColor" must be a hex color string like #1A2B3C.',
      });
    }

    // Upsert the preference
    const updatedPref = await IslamicDefinitionPreferenceDOA.upsertPreference(
      req.user.userId,
      definitionId,
      isHidden,
      defaultColor ?? null,
    );

    // Update the hide flag on all matching events
    const visibilityUpdated = await EventDOA.updateHideByDefinitionId(
      req.user.userId,
      definitionId,
      isHidden,
    );

    let colorUpdated = 0;
    if (defaultColor != null) {
      colorUpdated = await EventDOA.updateColorByDefinitionId(
        req.user.userId,
        definitionId,
        defaultColor,
      );
    }

    return res.json({
      success: true,
      definitionId,
      isHidden,
      defaultColor: updatedPref.defaultColor,
      eventsUpdated: visibilityUpdated,
      colorUpdated,
    });
  } catch (error) {
    defaultLogger.error("UpdateDefinitionPreference error", { error, requestId: req.requestId, userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      message: "Failed to update definition preference.",
    });
  }
}
