import EventDOA from '../../model/db/doa/EventDOA.js';
import { sendJson } from '../SendJson.js';

/**
 * DELETE /events/:eventId
 * Delete an event owned by the current user.
 */
export default async function DeleteEvent(req, res) {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return sendJson(res, {
                success: false,
                message: 'Invalid event ID',
            }, 400);
        }

        const deleted = await EventDOA.deleteEvent(eventId, req.user.userId);

        if (!deleted) {
            return sendJson(res, {
                success: false,
                message: 'Event not found',
            }, 404);
        }

        res.status(204).send();
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to delete event',
        }, 500);
    }
}
