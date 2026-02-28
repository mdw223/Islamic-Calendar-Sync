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
      return res.status(400).json({
        success: false,
        message:
          "Request body must contain a \"year\" field with an integer between 2000 and 2100.",
      });
    }

    const { events, generatedCount } = await generateForUser(
      req.user.userId,
      year,
    );

    return res.status(201).json({
      success: true,
      events,
      generatedCount,
    });
  } catch (error) {
    console.error("GenerateEvents error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate Islamic events.",
    });
  }
}
