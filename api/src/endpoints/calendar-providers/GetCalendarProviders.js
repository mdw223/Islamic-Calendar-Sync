import CalendarProviderDOA from '../../model/db/doa/CalendarProviderDOA.js';
/**
 * GET /calendar-providers
 * Get all calendar providers linked to the current user.
 * Sensitive token/salt fields are stripped by CalendarProvider.toJSON().
 */
export default async function GetCalendarProviders(req, res) {
    try {
        const calendarProviders = await CalendarProviderDOA.findAllByUserId(req.user.userId);

        return res.json({
            success: true,
            calendarProviders: calendarProviders,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to get calendar providers',
        });
    }
}
