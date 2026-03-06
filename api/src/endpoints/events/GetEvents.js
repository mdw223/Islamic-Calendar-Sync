import EventDOA from '../../model/db/doa/EventDOA.js';
import { sendJson } from '../SendJson.js';

/**
 * GET /events
 * Get all events for the current user.
 */
export default async function GetEvents(req, res) {
    try {
        const events = await EventDOA.findAllByUserId(req.user.userId);

        // TODO: can convert to .ics here in sep endpoint

        return sendJson(res, {
            success: true,
            events,
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to get events',
        }, 500);
    }
}
