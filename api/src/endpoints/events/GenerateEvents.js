/**
 * POST /events/generate
 *
 * Generate Islamic calendar events for one or more Gregorian years.
 * Uses the user's definition preferences to determine which events to create.
 * The backend's bulkUpsert handles idempotency — re-calling for the same
 * year is harmless (existing events are updated, not duplicated).
 *
 * Request body:
 *   { years: number[] }  — Array of Gregorian years, e.g. [2025, 2026]
 *
 * Success response (201):
 *   { success: true, events: Event[], generatedCount: number }
 *
 * Error responses:
 *   400 — missing or invalid years
 *   500 — server error
 */
import { generateForUser } from "../../services/IslamicEventService.js";
import { sendJson } from "../SendJson.js";

export default async function GenerateEvents(req, res) {
  try {
    const { years } = req.body;
    const currentYear = new Date().getFullYear();

    if (
      !Array.isArray(years) ||
      years.length === 0 ||
      !years.every(
        (y) => Number.isInteger(y) && y >= currentYear && y <= 2100,
      )
    ) {
      return sendJson(res, {
        success: false,
        message:
          `Request body must contain a "years" field with a non-empty array of integers between ${currentYear} and 2100.`,
      }, 400);
    }

    const { events, generatedCount } = await generateForUser(
      req.user.userId,
      years,
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
