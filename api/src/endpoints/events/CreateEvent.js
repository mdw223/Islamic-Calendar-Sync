import EventDOA from '../../model/db/doa/EventDOA.js';
import { Event } from '../../model/models/Event.js';
import { validateStoredUserRRule } from '../../services/EventExpansionService.js';
import { sanitizeDescription } from '../../util/sanitizeHtml.js';

/**
 * POST /events
 * Create a new event for the current user.
 */
export default async function CreateEvent(req, res) {
    try {
        const eventData = Event.fromRequest(req.body);
        eventData.description = sanitizeDescription(eventData.description);

        if (!eventData.name || !eventData.startDate || !eventData.endDate || !eventData.eventTypeId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, startDate, endDate, eventTypeId',
            });
        }

        if (eventData.name.length > 1024) {
            return res.status(400).json({
                success: false,
                message: 'Event name must be 1024 characters or fewer.',
            });
        }

        if (eventData.description && eventData.description.length > 50000) {
            return res.status(400).json({
                success: false,
                message: 'Event description must be 50,000 characters or fewer.',
            });
        }

        if (eventData.location && eventData.location.length > 1024) {
            return res.status(400).json({
                success: false,
                message: 'Event location must be 1024 characters or fewer.',
            });
        }

        if (eventData.rrule === '') {
            eventData.rrule = null;
        } else if (eventData.rrule != null && eventData.rrule !== '') {
            const rr = validateStoredUserRRule(eventData.rrule);
            if (!rr.ok) {
                return res.status(400).json({
                    success: false,
                    message: rr.message,
                });
            }
            eventData.rrule = rr.value || null;
        }

        const event = await EventDOA.createEvent({ ...eventData, userId: req.user.userId });

        return res.status(201).json({
            success: true,
            event,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to create event',
        });
    }
}
