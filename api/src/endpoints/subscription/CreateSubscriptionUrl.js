import { appConfig } from "../../Config.js";
import { sendJson } from "../SendJson.js";
import crypto from "crypto";
import UserDOA from "../../model/db/doa/UserDOA.js";

function subscriptionEventsUrl(token) {
  const base = appConfig.BASE_URL.replace(/\/$/, "");
  return `${base}/api/subscription/events?token=${encodeURIComponent(token)}`;
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

    const token = crypto.randomBytes(32).toString("hex");
    const createdAt = Date.now();
    const hash = crypto.createHash("sha256").update(token, "utf8").digest("hex");
    await UserDOA.updateUser(userId, {
      subscriptiontokenhash: hash,
      subscriptiontokencreatedat: createdAt,
      subscriptiontokenrevokedat: null,
    });

    return sendJson(
      res,
      {
        success: true,
        subscriptionUrl: subscriptionEventsUrl(token),
      },
      200,
    );
  } catch {
    return sendJson(
      res,
      { success: false, message: "Failed to create subscription url" },
      500,
    );
  }
}
