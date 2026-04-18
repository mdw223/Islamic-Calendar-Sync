/**
 * GET /definitions
 *
 * Returns the full list of Islamic event definitions from islamicEvents.json,
 * merged with the current user's show/hide preferences from the database.
 *
 * Success response (200):
 *   { success: true, definitions: Array<{ id, titleAr, titleEn, ..., isHidden }> }
 */
import { getMergedDefinitions } from "../../services/IslamicEventService.js";
import { defaultLogger } from "../../middleware/logger.js";
export default async function GetDefinitions(req, res) {
  try {
    const definitions = await getMergedDefinitions(req.user.userId);

    return res.json({
      success: true,
      definitions,
    });
  } catch (error) {
    defaultLogger.error("GetDefinitions error", { error, requestId: req.requestId, userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      message: "Failed to load definitions.",
    });
  }
}
