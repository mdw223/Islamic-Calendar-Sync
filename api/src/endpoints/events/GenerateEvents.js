/**
 * POST /events/generate
 *
 * Generate Islamic calendar events for a given Gregorian year.
 * Uses the user's definition preferences to determine which events to create.
 * The backend's bulkUpsert handles idempotency — re-calling for the same
 * year is harmless (existing events are updated, not duplicated).
 *
 * Request body:
 *   { year: number }  — Gregorian year, e.g. 2026
 *
 * Success response (201):
 *   { success: true, events: Event[], generatedCount: number }
 *
 * Error responses:
 *   400 — missing or invalid year
 *   500 — server error
 */
import { generateForUser } from "../../services/IslamicEventService.js";
import { sendJson } from "../SendJson.js";

export default async function GenerateEvents(req, res) {
  try {
    const { year } = req.body;

    // Validate year
    if (
      year == null ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return sendJson(res, {
        success: false,
        message:
          "Request body must contain a \"year\" field with an integer between 2000 and 2100.",
      }, 400);
    }

    const { events, generatedCount } = await generateForUser(
      req.user.userId,
      year,
    );

    return sendJson(res, {
      success: true,
      events,
      generatedCount,
    }, 201);
  } catch (error) {
    console.error("GenerateEvents error:", error);
    return sendJson(res, {
      success: false,
      message: "Failed to generate Islamic events.",
    }, 500);
  }
}
