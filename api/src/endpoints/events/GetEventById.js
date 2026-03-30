import EventDOA from '../../model/db/doa/EventDOA.js';
/**
 * GET /events/:eventId
 * Get a single event by ID for the current user.
 */
export default async function GetEventById(req, res) {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID',
            });
        }

        const event = await EventDOA.findById(eventId, req.user.userId);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        return res.json({
            success: true,
            event,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get event',
        });
    }
}
