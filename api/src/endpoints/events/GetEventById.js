import EventDOA from '../../model/db/doa/EventDOA.js';
import { sendJson } from '../SendJson.js';

/**
 * GET /events/:eventId
 * Get a single event by ID for the current user.
 */
export default async function GetEventById(req, res) {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return sendJson(res, {
                success: false,
                message: 'Invalid event ID',
            }, 400);
        }

        const event = await EventDOA.findById(eventId, req.user.userId);

        if (!event) {
            return sendJson(res, {
                success: false,
                message: 'Event not found',
            }, 404);
        }

        return sendJson(res, {
            success: true,
            event,
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to get event',
        }, 500);
    }
}
