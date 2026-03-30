import EventDOA from '../../model/db/doa/EventDOA.js';
/**
 * DELETE /events
 * Delete every event owned by the current user (full calendar reset).
 * Returns 204 even when there were no rows (empty calendar).
 */
export default async function DeleteAllEvents(req, res) {
    try {
        await EventDOA.deleteAllEvents(req.user.userId);
        res.status(204).send();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to delete all events',
        });
    }
}
