import EventDOA from '../../model/db/doa/EventDOA.js';
import { sanitizeDescription } from '../../util/SanitizeHtml.js';
import { sendJson } from '../SendJson.js';
import { validateStoredUserRRule } from '../../services/EventExpansionService.js';

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

        if (req.body.rrule === '') {
            req.body.rrule = null;
        } else if (req.body.rrule !== undefined && req.body.rrule !== null) {
            const rr = validateStoredUserRRule(req.body.rrule);
            if (!rr.ok) {
                return sendJson(res, {
                    success: false,
                    message: rr.message,
                }, 400);
            }
            req.body.rrule = rr.value || null;
        }

        const userId = req.user.userId;

        const userEvent = await EventDOA.findById(eventId, userId);
        if (!userEvent) {
            return sendJson(res, {
                success: false,
                message: 'Event not found',
            }, 404);
        }

        const updated = await EventDOA.updateEvent(eventId, userId, req.body);
        return sendJson(res, { success: true, event: updated });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to update event',
        }, 500);
    }
}
