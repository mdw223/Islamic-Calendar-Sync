import EventDOA from '../../model/db/doa/EventDOA.js';
import { sanitizeDescription } from '../../util/SanitizeHtml.js';
import { sendJson } from '../SendJson.js';

/**
 * PUT /events/:eventId
 * Update an existing event owned by the current user.
 */
export default async function UpdateEvent(req, res) {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return sendJson(res, {
                success: false,
                message: 'Invalid event ID',
            }, 400);
        }

        if (req.body.description !== undefined) {
            req.body.description = sanitizeDescription(req.body.description);
        }

        const event = await EventDOA.updateEvent(eventId, req.user.userId, req.body);

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
            message: 'Failed to update event',
        }, 500);
    }
}
