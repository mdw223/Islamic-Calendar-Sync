import UserDOA from "../../model/db/doa/UserDOA.js";
export default async function RevokeSubscription(req, res) {
  try {
    const userId = req.user.userId;
    const revokedAt = Date.now();
    const updated = await UserDOA.updateUser(userId, {
      subscriptiontokenhash: null,
      subscriptiontokenrevokedat: revokedAt,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Subscription revoked. Existing calendar URLs will stop working.",
      subscriptionTokenRevokedAt: revokedAt,
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to revoke subscription" });
  }
}
