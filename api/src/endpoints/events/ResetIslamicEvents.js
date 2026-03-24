/**
 * POST /events/islamic/reset
 *
 * Deletes Islamic calendar master rows for the given definition IDs only.
 * Recomputes the user's generated-years range from remaining Islamic rows.
 */
import EventDOA from "../../model/db/doa/EventDOA.js";
import UserDOA from "../../model/db/doa/UserDOA.js";
import { sendJson } from "../SendJson.js";

const MAX_DEFINITION_IDS = 200;

export default async function ResetIslamicEvents(req, res) {
  try {
    const { definitionIds } = req.body ?? {};

    if (
      !Array.isArray(definitionIds) ||
      definitionIds.length === 0 ||
      definitionIds.length > MAX_DEFINITION_IDS
    ) {
      return sendJson(
        res,
        {
          success: false,
          message: `Request body must contain a non-empty "definitionIds" array (max ${MAX_DEFINITION_IDS} items).`,
        },
        400,
      );
    }

    if (!definitionIds.every((id) => typeof id === "string" && id.length > 0)) {
      return sendJson(
        res,
        {
          success: false,
          message: 'Each "definitionIds" entry must be a non-empty string.',
        },
        400,
      );
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

    return sendJson(res, {
      success: true,
      deletedCount,
      generatedYearsStart,
      generatedYearsEnd,
    });
  } catch (error) {
    console.error("ResetIslamicEvents error:", error);
    return sendJson(
      res,
      {
        success: false,
        message: "Failed to reset Islamic events.",
      },
      500,
    );
  }
}
