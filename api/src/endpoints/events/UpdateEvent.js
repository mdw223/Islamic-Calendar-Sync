import EventDOA from '../../model/db/doa/EventDOA.js';

/**
 * PUT /events/:eventId
 * Update an existing event owned by the current user.
 */
export default async function UpdateEvent(req, res) {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID',
            });
        }

        const event = await EventDOA.updateEvent(eventId, req.user.userId, req.body);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        res.json({
            success: true,
            event,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update event',
        });
    }
}
