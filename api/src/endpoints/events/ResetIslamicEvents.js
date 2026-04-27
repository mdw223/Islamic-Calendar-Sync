/**
 * POST /events/islamic/reset
 *
 * Deletes Islamic calendar master rows for the given definition IDs only.
 * Recomputes the user's generated-years range from remaining Islamic rows.
 */
import EventDOA from "../../model/db/doa/EventDOA.js";
import UserDOA from "../../model/db/doa/UserDOA.js";
import { defaultLogger } from "../../middleware/Logger.js";
const MAX_DEFINITION_IDS = 200;

export default async function ResetIslamicEvents(req, res) {
  try {
    const { definitionIds } = req.body ?? {};

    if (
      !Array.isArray(definitionIds) ||
      definitionIds.length === 0 ||
      definitionIds.length > MAX_DEFINITION_IDS
    ) {
      return res.status(400).json({
        success: false,
        message: `Request body must contain a non-empty "definitionIds" array (max ${MAX_DEFINITION_IDS} items).`,
      });
    }

    if (!definitionIds.every((id) => typeof id === "string" && id.length > 0)) {
      return res.status(400).json({
        success: false,
        message: 'Each "definitionIds" entry must be a non-empty string.',
      });
    }

    const userId = req.user.userId;

    const deletedCount = await EventDOA.deleteIslamicEventsForDefinitionIds(
      userId,
      definitionIds,
    );

    const bounds = await EventDOA.getIslamicGeneratedYearBounds(userId);

    let generatedYearsStart = null;
    let generatedYearsEnd = null;

    if (bounds) {
      generatedYearsStart = bounds.start;
      generatedYearsEnd = bounds.end;
      await UserDOA.updateGeneratedYearsRange(
        userId,
        generatedYearsStart,
        generatedYearsEnd,
      );
    } else {
      await UserDOA.updateGeneratedYearsRange(userId, null, null);
    }

    return res.json({
      success: true,
      deletedCount,
      generatedYearsStart,
      generatedYearsEnd,
    });
  } catch (error) {
    defaultLogger.error("ResetIslamicEvents error", { error, requestId: req.requestId, userId: req.user?.userId });
    return res.status(500).json({
      success: false,
      message: "Failed to reset Islamic events.",
    });
  }
}
