import UserDOA from "../../model/db/doa/UserDOA.js";
import { sendJson } from "../SendJson.js";

export default async function RevokeSubscription(req, res) {
  try {
    const userId = req.user.userId;
    const revokedAt = Date.now();
    const updated = await UserDOA.updateUser(userId, {
      subscriptiontokenhash: null,
      subscriptiontokenrevokedat: revokedAt,
    });
    if (!updated) {
      return sendJson(res, { success: false, message: "User not found" }, 404);
    }
    return sendJson(
      res,
      {
        success: true,
        message: "Subscription revoked. Existing calendar URLs will stop working.",
        subscriptionTokenRevokedAt: revokedAt,
      },
      200,
    );
  } catch {
    return sendJson(
      res,
      { success: false, message: "Failed to revoke subscription" },
      500,
    );
  }
}
