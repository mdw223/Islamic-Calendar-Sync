import EventDOA from '../../model/db/doa/EventDOA.js';
/**
 * DELETE /events/:eventId
 * Delete an event owned by the current user.
 */
export default async function DeleteEvent(req, res) {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event ID',
            });
        }

        const deleted = await EventDOA.deleteEvent(eventId, req.user.userId);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        res.status(204).send();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete event',
        });
    }
}
