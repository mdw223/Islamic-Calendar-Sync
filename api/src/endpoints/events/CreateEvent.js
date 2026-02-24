import EventDOA from '../../model/db/doa/EventDOA.js';
import { Event } from '../../model/models/Event.js';

/**
 * POST /events
 * Create a new event for the current user.
 */
export default async function CreateEvent(req, res) {
    try {
        const eventData = Event.fromRequest(req.body);

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

        const event = await EventDOA.createEvent({ ...eventData, userId: req.user.userId });

        res.status(201).json({
            success: true,
            event,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create event',
        });
    }
}
