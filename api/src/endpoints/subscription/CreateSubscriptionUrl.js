import { appConfig } from "../../Config.js";
import { subscriptionConfig } from "../../Config.js";
import crypto from "crypto";
import SubscriptionTokenDOA from "../../model/db/doa/SubscriptionTokenDOA.js";
import SubscriptionDefinitionSelectionDOA from "../../model/db/doa/SubscriptionDefinitionSelectionDOA.js";
import { GenerateToken } from "../../middleware/AuthMiddleware.js";
import { getBaseDefinitions } from "../../services/IslamicEventService.js";
import { SubscriptionDefinitionId } from "../../Constants.js";

function SubscriptionEventsUrl(token) {
  const base = appConfig.SUBSCRIPTION_URL.replace(/\/$/, "");
  return `${base}/api/subscription/events?token=${encodeURIComponent(token)}`;
}

export default async function CreateSubscriptionUrl(req, res) {
  try {
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

    const userId = req.user.userId;
    const activeCount = await SubscriptionTokenDOA.countActiveByUserId(userId);
    if (activeCount >= subscriptionConfig.MAX_ACTIVE_URLS) {
      return res.status(409).json({
        success: false,
        message: `You can only have ${subscriptionConfig.MAX_ACTIVE_URLS} active subscription URLs. Revoke one before creating another.`,
      });
    }

    const maxNameLength = 100;
    const nameRaw = req.body?.name;
    const normalizedName =
      typeof nameRaw === "string" && nameRaw.trim().length > 0
        ? nameRaw.trim()
        : null;
    if (
      normalizedName != null &&
      normalizedName.length > maxNameLength
    ) {
      return res.status(400).json({
        success: false,
        message: `Subscription name must be at most ${maxNameLength} characters.`,
      });
    }

    const salt = crypto.randomBytes(8).toString("hex");
    const token = GenerateToken(req.user, salt);
    const createdAt = Date.now();
    const tokenHash = crypto
      .createHash("sha256")
      .update(token, "utf8")
      .digest("hex");

    const created = await SubscriptionTokenDOA.createToken({
      userId,
      name: normalizedName,
      tokenHash,
      salt,
      createdAt,
    });
    await SubscriptionDefinitionSelectionDOA.replaceForToken(
      created.subscriptionTokenId,
      normalizedDefinitionIds,
    );
    const subscriptionUrl = SubscriptionEventsUrl(token);

    res.json({
      success: true,
      subscription: {
        subscriptionTokenId: created.subscriptionTokenId,
        name: created.name,
        createdAt: created.createdAt,
        definitionIds: normalizedDefinitionIds,
        subscriptionUrl,
      },
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to create subscription url" });
  }
}
