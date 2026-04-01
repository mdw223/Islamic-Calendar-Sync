import UserDOA from "../../model/db/doa/UserDOA.js";
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
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      hasActiveSubscription: hasActiveSubscription(user),
      subscriptionTokenCreatedAt: user.subscriptionTokenCreatedAt,
      subscriptionTokenRevokedAt: user.subscriptionTokenRevokedAt,
      subscriptionUrl: user.subscriptionUrl,
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to get subscription status" });
  }
}
