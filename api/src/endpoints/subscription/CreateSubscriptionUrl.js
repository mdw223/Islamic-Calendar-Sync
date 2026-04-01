import { appConfig } from "../../Config.js";
import crypto from "crypto";
import UserDOA from "../../model/db/doa/UserDOA.js";
import { GenerateToken } from "../../middleware/AuthMiddleware.js";

function SubscriptionEventsUrl(token) {
  const base = appConfig.SUBSCRIPTION_URL.replace(/\/$/, "");
  return `${base}/api/subscription/events?token=${token}`;
}

function HasActiveSubscription(user) {
  return (
    user?.subscriptionTokenHash != null &&
    user.subscriptionTokenRevokedAt == null
  );
}

export default async function CreateSubscriptionUrl(req, res) {
  try {
    const userId = req.user.userId;
    const existing = await UserDOA.findById(userId);
    if (existing && HasActiveSubscription(existing)) {
      return res.status(409).json({
        success: false,
        message:
          "A subscription URL is already active. Use rotate to get a new link.",
      });
    }

    const token = GenerateToken(req.user);
    const createdAt = Date.now();
    const subscriptionUrl = SubscriptionEventsUrl(token);
    await UserDOA.updateUser(userId, {
      subscriptionUrl: subscriptionUrl,
      subscriptiontokenhash: token,
      subscriptiontokencreatedat: createdAt,
      subscriptiontokenrevokedat: null,
    });

    res.json({
      success: true,
      subscriptionUrl: subscriptionUrl
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to create subscription url" });
  }
}
