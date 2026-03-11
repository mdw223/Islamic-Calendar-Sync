import EventDOA from '../../model/db/doa/EventDOA.js';
import { sendJson } from '../SendJson.js';
import { generateOccurrencesFromRRule } from '../../util/RruleUtils.js';
import { mergeSystemAndUserEvents } from '../../util/EventMergeUtils.js';

/**
 * GET /events
 * Get all events for the current user.
 */
export default async function GetEvents(req, res) {
    try {
        // Fetch all system events (IsSystemEvent = true)
        const systemEvents = await EventDOA.findAllSystemEvents();
        // Fetch all user events (IsSystemEvent = false)
        const userEvents = await EventDOA.findAllByUserId(req.user.userId);

        // Generate occurrences for system events for the current year
        const year = new Date().getFullYear();
        let systemEventOccurrences = [];
        for (const sysEvent of systemEvents) {
            const occurrences = generateOccurrencesFromRRule(sysEvent, year).map(occ => ({
                ...sysEvent,
                startDate: occ.startDate.toISOString(),
                endDate: occ.endDate.toISOString(),
            }));
            systemEventOccurrences.push(...occurrences);
        }

        // Merge system event occurrences and user overrides
        const mergedEvents = mergeSystemAndUserEvents(systemEventOccurrences, userEvents);

        return sendJson(res, {
            success: true,
            events: mergedEvents,
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to get events',
        }, 500);
    }
}
