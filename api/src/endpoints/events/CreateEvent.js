import EventDOA from '../../model/db/doa/EventDOA.js';
import { Event } from '../../model/models/Event.js';
import { sendJson } from '../SendJson.js';
import { validateStoredUserRRule } from '../../services/EventExpansionService.js';

/**
 * POST /events
 * Create a new event for the current user.
 */
export default async function CreateEvent(req, res) {
    try {
        const eventData = Event.fromRequest(req.body);

        if (!eventData.name || !eventData.startDate || !eventData.endDate || !eventData.eventTypeId) {
            return sendJson(res, {
                success: false,
                message: 'Missing required fields: name, startDate, endDate, eventTypeId',
            }, 400);
        }

        if (eventData.name.length > 1024) {
            return sendJson(res, {
                success: false,
                message: 'Event name must be 1024 characters or fewer.',
            }, 400);
        }

        if (eventData.description && eventData.description.length > 50000) {
            return sendJson(res, {
                success: false,
                message: 'Event description must be 50,000 characters or fewer.',
            }, 400);
        }

        if (eventData.location && eventData.location.length > 1024) {
            return sendJson(res, {
                success: false,
                message: 'Event location must be 1024 characters or fewer.',
            }, 400);
        }

        if (eventData.rrule === '') {
            eventData.rrule = null;
        } else if (eventData.rrule != null && eventData.rrule !== '') {
            const rr = validateStoredUserRRule(eventData.rrule);
            if (!rr.ok) {
                return sendJson(res, {
                    success: false,
                    message: rr.message,
                }, 400);
            }
            eventData.rrule = rr.value || null;
        }

        const event = await EventDOA.createEvent({ ...eventData, userId: req.user.userId });

        return sendJson(res, {
            success: true,
            event,
        }, 201);
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to create event',
        }, 500);
    }
}
