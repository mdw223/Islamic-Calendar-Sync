import EventDOA from '../../model/db/doa/EventDOA.js';
import {
    expandStoredEventsForRange,
    parseRangeDateParam,
    endOfLocalDay,
} from '../../services/EventExpansionService.js';

/**
 * GET /events
 * Query: optional from=YYYY-MM-DD, to=YYYY-MM-DD (inclusive).
 * Returns calendar instances (Islamic series and RRule series expanded for the range).
 * If from/to omitted, uses a default window around the current year.
 */
export default async function GetEvents(req, res) {
    try {
        const userEvents = await EventDOA.findAllByUserId(req.user.userId);

        const cy = new Date().getFullYear();
        let fromD;
        let toD;
        if (req.query.from != null && req.query.to != null) {
            fromD = parseRangeDateParam(req.query.from);
            toD = endOfLocalDay(parseRangeDateParam(req.query.to));
        } else {
            fromD = new Date(cy - 1, 0, 1, 0, 0, 0, 0);
            toD = endOfLocalDay(new Date(cy + 2, 11, 31, 0, 0, 0, 0));
        }

        if (toD.getTime() < fromD.getTime()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid range: "to" must be on or after "from".',
            });
        }

        const expanded = expandStoredEventsForRange(userEvents, fromD, toD);

        return res.json({
            success: true,
            events: expanded,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get events',
        });
    }
}
