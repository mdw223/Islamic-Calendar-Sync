import { appConfig, subscriptionConfig } from "../../Config.js";
import jwt from "jsonwebtoken";
import SubscriptionTokenDOA from "../../model/db/doa/SubscriptionTokenDOA.js";

function subscriptionEventsUrl(token) {
	const base = appConfig.SUBSCRIPTION_URL.replace(/\/$/, "");
	return `${base}/api/subscription/events?token=${encodeURIComponent(token)}`;
}

export default async function GetSubscriptionUrls(req, res) {
	try {
		const userId = req.user.userId;
		const subscriptions = await SubscriptionTokenDOA.findActiveByUserId(userId);

		const result = subscriptions.map((subscription) => {
			const token = jwt.sign(
				{ userId },
				appConfig.API_SECRET + subscription.salt,
			);
			return {
				subscriptionTokenId: subscription.subscriptionTokenId,
				name: subscription.name,
				createdAt: subscription.createdAt,
				subscriptionUrl: subscriptionEventsUrl(token),
			};
		});

		return res.status(200).json({
			success: true,
			subscriptionUrls: result,
			maxActiveUrls: subscriptionConfig.MAX_ACTIVE_URLS,
		});
	} catch {
		return res.status(500).json({
			success: false,
			message: "Failed to get subscription urls",
		});
	}
}