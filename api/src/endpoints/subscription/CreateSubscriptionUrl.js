import { appConfig } from "../../Config.js";
import { sendJson } from "../SendJson.js";
import crypto from "crypto";
import UserDOA from "../../model/db/doa/UserDOA.js";
import { GenerateToken } from "../../middleware/AuthMiddleware.js";

function subscriptionEventsUrl(token) {
  const base = appConfig.SUBSCRIPTION_URL.replace(/\/$/, "");
  return `${base}/api/subscription/events?token=${token}`;
}

function hasActiveSubscription(user) {
  return (
    user?.subscriptionTokenHash != null &&
    user.subscriptionTokenRevokedAt == null
  );
}

export default async function CreateSubscriptionUrl(req, res) {
  try {
    const userId = req.user.userId;
    const existing = await UserDOA.findById(userId);
    if (existing && hasActiveSubscription(existing)) {
      return sendJson(
        res,
        {
          success: false,
          message:
            "A subscription URL is already active. Use rotate to get a new link.",
        },
        409,
      );
    }

    const token = GenerateToken(req.user);
    const createdAt = Date.now();
    await UserDOA.updateUser(userId, {
      subscriptiontokenhash: token,
      subscriptiontokencreatedat: createdAt,
      subscriptiontokenrevokedat: null,
    });

    res.json({
      success: true,
      subscriptionUrl: subscriptionEventsUrl(token),
    });
  } catch {
    return sendJson(
      res,
      { success: false, message: "Failed to create subscription url" },
      500,
    );
  }
}
