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
export default async function UpdateDefinitionPreference(req, res) {
  try {
    const { definitionId } = req.params;
    const { isHidden } = req.body;

    if (typeof isHidden !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Request body must contain \"isHidden\" as a boolean.",
      });
    }

    // Upsert the preference
    await IslamicDefinitionPreferenceDOA.upsertPreference(
      req.user.userId,
      definitionId,
      isHidden,
    );

    // Update the hide flag on all matching events
    const eventsUpdated = await EventDOA.updateHideByDefinitionId(
      req.user.userId,
      definitionId,
      isHidden,
    );

    return res.json({
      success: true,
      definitionId,
      isHidden,
      eventsUpdated,
    });
  } catch (error) {
    console.error("UpdateDefinitionPreference error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update definition preference.",
    });
  }
}
