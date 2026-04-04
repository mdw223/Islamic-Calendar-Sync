import EventDOA from "../../model/db/doa/EventDOA.js";
import { subscriptionConfig } from "../../Config.js";
import {
  expandStoredEventsForRange,
  endOfLocalDay,
} from "../../services/EventExpansionService.js";
import GetEventsIcs from "../events/GetEventsIcs.js";

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

    return GetEventsIcs(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to get subscription events",
    });
  }
}
