import EventDOA from '../../model/db/doa/EventDOA.js';
import {
    expandStoredEventsForRange,
    parseRangeDateParam,
    endOfLocalDay,
} from '../../services/EventExpansionService.js';
import { buildIcsString } from '../../services/IcsBuilder.js';

function parseYearsQuery(rawYears) {
    if (rawYears == null) {
        return { years: null };
    }

    const tokens = String(rawYears)
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);

    if (tokens.length === 0) {
        return { error: 'Query parameter "years" must contain at least one year.' };
    }

    const years = [];
    for (const token of tokens) {
        if (!/^\d{4}$/.test(token)) {
            return { error: 'Query parameter "years" must be a comma-separated list of years, e.g. years=2025,2027.' };
        }
        years.push(parseInt(token, 10));
    }

    return { years: Array.from(new Set(years)).sort((a, b) => a - b) };
}

/**
 * GET /events.ics
 * Authenticated. Same optional from/to query and expansion as GET /events.
 * Response: text/calendar body (download), not JSON.
 */
export default async function GetEventsIcs(req, res) {
    try {
        const userEvents = await EventDOA.findAllByUserId(req.user.userId);
        const { years, error } = parseYearsQuery(req.query.years);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error,
            });
        }

        const cy = new Date().getFullYear();
        let fromD;
        let toD;
        if (years && years.length > 0) {
            fromD = new Date(years[0], 0, 1, 0, 0, 0, 0);
            toD = endOfLocalDay(new Date(years[years.length - 1], 11, 31, 0, 0, 0, 0));
        } else if (req.query.from != null && req.query.to != null) {
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
        const selectedYears = years ? new Set(years) : null;
        const filtered = selectedYears
            ? expanded.filter((ev) => {
                if (!ev.startDate) return false;
                const y = new Date(ev.startDate).getFullYear();
                return selectedYears.has(y);
            })
            : expanded;
        const icsText = buildIcsString(filtered, {addSubscriptionUrl: true});

        res.status(200);
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="events.ics"');
        res.setHeader('Cache-Control', 'no-store');
        return res.send(icsText);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to export events',
        });
    }
}
