import EventDOA from "../../model/db/doa/EventDOA.js";
import { subscriptionConfig } from "../../Config.js";
import {
  expandStoredEventsForRange,
  endOfLocalDay,
} from "../../services/EventExpansionService.js";
import { sendJson } from "../SendJson.js";

export default async function GetSubscriptionEvents(req, res) {
  try {
    const userEvents = await EventDOA.findAllByUserId(req.user.userId);
    const cy = new Date().getFullYear();
    const fromD = new Date(cy - 1, 0, 1, 0, 0, 0, 0);
    const toD = endOfLocalDay(new Date(cy + subscriptionConfig.DEFAULT_RANGE_YEARS, 11, 31, 0, 0, 0, 0));
    const expanded = expandStoredEventsForRange(userEvents, fromD, toD);

    return sendJson(res, {
      success: true,
      events: expanded,
    }, 200);
  } catch (error) {
    return sendJson(res, {
      success: false,
      message: "Failed to get subscription events",
    }, 500);
  }
}
