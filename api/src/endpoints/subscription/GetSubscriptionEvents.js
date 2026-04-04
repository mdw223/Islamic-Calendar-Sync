import { subscriptionConfig } from "../../Config.js";
import GetEventsIcs from "../events/GetEventsIcs.js";
import SubscriptionDefinitionSelectionDOA from "../../model/db/doa/SubscriptionDefinitionSelectionDOA.js";
import { SubscriptionDefinitionId } from "../../Constants.js";
import { getBaseDefinitions } from "../../services/IslamicEventService.js";

// Delegate the actual iCalendar rendering to the shared ICS endpoint so the
// VEVENT objects stay consistent across exports/subscriptions.
//
// If the caller didn't provide a range, apply the subscription default.
export default async function GetSubscriptionEvents(req, res) {
  try {
    const cy = new Date().getFullYear();
    if (req.query.years == null && (req.query.from == null || req.query.to == null)) {
      const from = `${cy - 1}-01-01`;
      const to = `${cy + subscriptionConfig.DEFAULT_RANGE_YEARS}-12-31`;
      req.query.from = from;
      req.query.to = to;
    }

    const subscriptionTokenId = req.subscriptionToken?.subscriptionTokenId;
    const selectedDefinitionIds = subscriptionTokenId
      ? await SubscriptionDefinitionSelectionDOA.findDefinitionIdsByTokenId(
          subscriptionTokenId,
        )
      : [];
    const normalizedDefinitionIds =
      selectedDefinitionIds.length > 0
        ? selectedDefinitionIds
        : [
            ...getBaseDefinitions().map((d) => d.id),
            SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS,
          ];

    const includeUserCreatedEvents = normalizedDefinitionIds.includes(
      SubscriptionDefinitionId.INCLUDE_USER_CREATED_EVENTS,
    );

    req.subscriptionSelection = {
      selectedDefinitionIds: normalizedDefinitionIds,
      includeUserCreatedEvents,
    };

    return GetEventsIcs(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get subscription events",
    });
  }
}
