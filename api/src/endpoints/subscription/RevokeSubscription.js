import SubscriptionTokenDOA from "../../model/db/doa/SubscriptionTokenDOA.js";

export default async function RevokeSubscription(req, res) {
  try {
    const userId = req.user.userId;
    const subscriptionTokenId = Number(req.body?.subscriptionTokenId);
    if (!Number.isInteger(subscriptionTokenId) || subscriptionTokenId <= 0) {
      return res.status(400).json({
        success: false,
        message: "subscriptionTokenId is required",
      });
    }

    const revoked = await SubscriptionTokenDOA.revokeById(
      userId,
      subscriptionTokenId,
    );
    if (!revoked) {
      return res.status(404).json({
        success: false,
        message: "Subscription URL not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Subscription revoked. Existing calendar URLs will stop working.",
      subscriptionTokenId: revoked.subscriptionTokenId,
    });
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to revoke subscription" });
  }
}
