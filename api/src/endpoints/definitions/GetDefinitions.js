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
import { sendJson } from "../SendJson.js";

export default async function GetDefinitions(req, res) {
  try {
    const definitions = await getMergedDefinitions(req.user.userId);

    return sendJson(res, {
      success: true,
      definitions,
    });
  } catch (error) {
    console.error("GetDefinitions error:", error);
    return sendJson(res, {
      success: false,
      message: "Failed to load definitions.",
    }, 500);
  }
}
