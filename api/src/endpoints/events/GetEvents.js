import EventDOA from '../../model/db/doa/EventDOA.js';
import { sendJson } from '../SendJson.js';

/**
 * GET /events
 * Get all events for the current user.
 */
export default async function GetEvents(req, res) {
    try {
        const userEvents = await EventDOA.findAllByUserId(req.user.userId);

        return sendJson(res, {
            success: true,
            events: userEvents.map((e) => e.toJSON()),
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to get events',
        }, 500);
    }
}
