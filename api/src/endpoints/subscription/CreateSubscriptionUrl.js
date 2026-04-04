import { appConfig } from "../../Config.js";
import { subscriptionConfig } from "../../Config.js";
import crypto from "crypto";
import SubscriptionTokenDOA from "../../model/db/doa/SubscriptionTokenDOA.js";
import { GenerateToken } from "../../middleware/AuthMiddleware.js";

function SubscriptionEventsUrl(token) {
  const base = appConfig.SUBSCRIPTION_URL.replace(/\/$/, "");
  return `${base}/api/subscription/events?token=${encodeURIComponent(token)}`;
}

export default async function CreateSubscriptionUrl(req, res) {
  try {
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
    const subscriptionUrl = SubscriptionEventsUrl(token);

    res.json({
      success: true,
      subscription: {
        subscriptionTokenId: created.subscriptionTokenId,
        name: created.name,
        createdAt: created.createdAt,
        subscriptionUrl,
      },
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to create subscription url" });
  }
}
