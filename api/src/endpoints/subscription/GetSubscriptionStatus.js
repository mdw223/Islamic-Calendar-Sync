import UserDOA from "../../model/db/doa/UserDOA.js";
import { sendJson } from "../SendJson.js";

function hasActiveSubscription(user) {
  return (
    user?.subscriptionTokenHash != null &&
    user.subscriptionTokenRevokedAt == null
  );
}

export default async function GetSubscriptionStatus(req, res) {
  try {
    const user = await UserDOA.findById(req.user.userId);
    if (!user) {
      return sendJson(res, { success: false, message: "User not found" }, 404);
    }
    return sendJson(
      res,
      {
        success: true,
        hasActiveSubscription: hasActiveSubscription(user),
        subscriptionTokenCreatedAt: user.subscriptionTokenCreatedAt,
        subscriptionTokenRevokedAt: user.subscriptionTokenRevokedAt,
      },
      200,
    );
  } catch {
    return sendJson(
      res,
      { success: false, message: "Failed to get subscription status" },
      500,
    );
  }
}
