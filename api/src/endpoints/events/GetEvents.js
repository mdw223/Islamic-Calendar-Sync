import EventDOA from '../../model/db/doa/EventDOA.js';

/**
 * GET /events
 * Get all events for the current user.
 */
export default async function GetEvents(req, res) {
    try {
        const events = await EventDOA.findAllByUserId(req.user.userId);

        res.json({
            success: true,
            events,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get events',
        });
    }
}
