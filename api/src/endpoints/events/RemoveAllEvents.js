import EventDOA from '../../model/db/doa/EventDOA.js';
import { sendJson } from '../SendJson.js';

/**
 * DELETE /events/:eventId
 * Delete an event owned by the current user.
 */
export default async function RemoveAllEvents(req, res) {
    try {
        const deleted = await EventDOA.deleteAllEvents(req.user.userId);

        if (!deleted) {
            return sendJson(res, {
                success: false,
                message: 'Failed to delete all events',
            }, 500);
        }

        res.status(204).send();
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to delete all events',
        }, 500);
    }
}
