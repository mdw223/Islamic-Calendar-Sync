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
export default async function GenerateEvents(req, res) {
  try {
    const { years, timezone = null } = req.body;
    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 5; // Allow generating up to 5 years in advance (inclusive)

    if (
      !Array.isArray(years) ||
      years.length === 0 ||
      !years.every(
        (y) => Number.isInteger(y) && y >= currentYear && y <= maxYear,
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Request body must contain a "years" field with a non-empty array of integers between ${currentYear} and ${maxYear}.`,
      });
    }

    if (timezone != null && (typeof timezone !== "string" || timezone.length > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Optional "timezone" must be a valid IANA timezone string.',
      });
    }

    const { events, generatedCount } = await generateForUser(
      req.user.userId,
      years,
      timezone,
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
