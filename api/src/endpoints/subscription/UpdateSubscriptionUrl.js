import SubscriptionTokenDOA from "../../model/db/doa/SubscriptionTokenDOA.js";
import SubscriptionDefinitionSelectionDOA from "../../model/db/doa/SubscriptionDefinitionSelectionDOA.js";
import { getBaseDefinitions } from "../../services/IslamicEventService.js";
import { SubscriptionDefinitionId } from "../../Constants.js";

export default async function UpdateSubscriptionUrl(req, res) {
  try {
    const userId = req.user.userId;
    const subscriptionTokenId = Number(req.params?.subscriptionTokenId);
    if (!Number.isInteger(subscriptionTokenId) || subscriptionTokenId <= 0) {
      return res.status(400).json({
        success: false,
        message: "subscriptionTokenId route parameter is required.",
      });
    }

    const maxNameLength = 100;
    const nameRaw = req.body?.name;
    const normalizedName =
      typeof nameRaw === "string" && nameRaw.trim().length > 0
        ? nameRaw.trim()
        : null;
    if (normalizedName != null && normalizedName.length > maxNameLength) {
      return res.status(400).json({
        success: false,
        message: `Subscription name must be at most ${maxNameLength} characters.`,
      });
    }

    const baseDefinitionIds = getBaseDefinitions().map((d) => d.id);
    const allowedDefinitionIds = new Set([
      ...baseDefinitionIds,
      SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS,
    ]);

    const submittedDefinitionIds = req.body?.definitionIds;
    if (!Array.isArray(submittedDefinitionIds) || submittedDefinitionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must contain a non-empty definitionIds array.",
      });
    }

    const normalizedDefinitionIds = Array.from(
      new Set(
        submittedDefinitionIds
          .filter((id) => typeof id === "string")
          .map((id) => id.trim())
          .filter((id) => id.length > 0),
      ),
    );
    if (normalizedDefinitionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must contain valid definitionIds.",
      });
    }

    const invalidDefinitionIds = normalizedDefinitionIds.filter(
      (id) => !allowedDefinitionIds.has(id),
    );
    if (invalidDefinitionIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more definitionIds are invalid.",
        invalidDefinitionIds,
      });
    }

    const updated = await SubscriptionTokenDOA.updateNameById(
      userId,
      subscriptionTokenId,
      normalizedName,
    );
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Subscription URL not found",
      });
    }

    await SubscriptionDefinitionSelectionDOA.replaceForToken(
      subscriptionTokenId,
      normalizedDefinitionIds,
    );

    return res.status(200).json({
      success: true,
      subscription: {
        subscriptionTokenId: updated.subscriptionTokenId,
        name: updated.name,
        createdAt: updated.createdAt,
        definitionIds: normalizedDefinitionIds,
      },
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to update subscription",
    });
  }
}
