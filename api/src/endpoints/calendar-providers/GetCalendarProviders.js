import CalendarProviderDOA from '../../model/db/doa/CalendarProviderDOA.js';
import { sendJson } from '../SendJson.js';

/**
 * GET /calendar-providers
 * Get all calendar providers linked to the current user.
 * Sensitive token/salt fields are stripped by CalendarProvider.toJSON().
 */
export default async function GetCalendarProviders(req, res) {
    try {
        const calendarProviders = await CalendarProviderDOA.findAllByUserId(req.user.userId);

        return sendJson(res, {
            success: true,
            calendarProviders: calendarProviders,
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to get calendar providers',
        }, 500);
    }
}
