import EventDOA from "../../model/db/doa/EventDOA.js";
import { subscriptionConfig } from "../../Config.js";
import {
  expandStoredEventsForRange,
  endOfLocalDay,
} from "../../services/EventExpansionService.js";
export default async function GetSubscriptionEvents(req, res) {
  try {
    const userEvents = await EventDOA.findAllByUserId(req.user.userId);
    const cy = new Date().getFullYear();
    const fromD = new Date(cy - 1, 0, 1, 0, 0, 0, 0);
    const toD = endOfLocalDay(new Date(cy + subscriptionConfig.DEFAULT_RANGE_YEARS, 11, 31, 0, 0, 0, 0));
    const expanded = expandStoredEventsForRange(userEvents, fromD, toD);
    return res.json({
      success: true,
      events: expanded,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get subscription events",
    });
  }
}
