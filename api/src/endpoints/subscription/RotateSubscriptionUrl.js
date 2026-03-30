import { appConfig } from "../../Config.js";
import crypto from "crypto";
import UserDOA from "../../model/db/doa/UserDOA.js";

function subscriptionEventsUrl(token) {
  const base = appConfig.BASE_URL.replace(/\/$/, "");
  return `${base}/api/subscription/events?token=${encodeURIComponent(token)}`;
}

export default async function RotateSubscriptionUrl(req, res) {
  try {
    const userId = req.user.userId;
    const token = crypto.randomBytes(32).toString("hex");
    const createdAt = Date.now();
    const hash = crypto.createHash("sha256").update(token, "utf8").digest("hex");
    const updated = await UserDOA.updateUser(userId, {
      subscriptiontokenhash: hash,
      subscriptiontokencreatedat: createdAt,
      subscriptiontokenrevokedat: null,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      subscriptionUrl: subscriptionEventsUrl(token),
      message:
        "Update the subscription URL in Google Calendar or your calendar app; the previous link no longer works.",
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to rotate subscription url" });
  }
}
