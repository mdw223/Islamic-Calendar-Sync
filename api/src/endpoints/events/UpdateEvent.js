import EventDOA from '../../model/db/doa/EventDOA.js';
import { sanitizeDescription } from '../../util/SanitizeHtml.js';
import { sendJson } from '../SendJson.js';

/**
 * PUT /events/:eventId
 * Update an existing event owned by the current user.
 */
export default async function UpdateEvent(req, res) {
    try {
        const eventId = parseInt(req.params.eventId);

        if (isNaN(eventId)) {
            return sendJson(res, {
                success: false,
                message: 'Invalid event ID',
            }, 400);
        }

        if (req.body.description !== undefined) {
            req.body.description = sanitizeDescription(req.body.description);
        }

        const userId = req.user.userId;

        const userEvent = await EventDOA.findById(eventId, userId);
        if (userEvent) {
            const updated = await EventDOA.updateEvent(eventId, userId, req.body);
            return sendJson(res, { success: true, event: updated });
        }

        const systemEvent = await EventDOA.findSystemEventById(eventId);
        if (!systemEvent) {
            return sendJson(res, {
                success: false,
                message: 'Event not found',
            }, 404);
        }

        const existingOverride = await EventDOA.findUserOverrideByParent(eventId, userId);
        if (existingOverride) {
            const updated = await EventDOA.updateEvent(existingOverride.eventId, userId, req.body);
            return sendJson(res, { success: true, event: updated });
        }

        const overrideData = {
            userId,
            name: req.body.name ?? systemEvent.name,
            location: req.body.location ?? systemEvent.location,
            startDate: req.body.startDate ?? systemEvent.startDate,
            endDate: req.body.endDate ?? systemEvent.endDate,
            isAllDay: req.body.isAllDay ?? systemEvent.isAllDay,
            description: req.body.description ?? systemEvent.description,
            hide: req.body.hide ?? systemEvent.hide,
            eventTypeId: req.body.eventTypeId ?? systemEvent.eventTypeId,
            isCustom: req.body.isCustom ?? systemEvent.isCustom,
            isTask: req.body.isTask ?? systemEvent.isTask,
            islamicDefinitionId: req.body.islamicDefinitionId ?? systemEvent.islamicDefinitionId,
            hijriMonth: req.body.hijriMonth ?? systemEvent.hijriMonth,
            hijriDay: req.body.hijriDay ?? systemEvent.hijriDay,
            durationDays: req.body.durationDays ?? systemEvent.durationDays,
            rrule: req.body.rrule ?? systemEvent.rrule,
            isSystemEvent: false,
            parentEventId: eventId,
        };

        const created = await EventDOA.createEvent(overrideData);
        return sendJson(res, { success: true, event: created }, 201);
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to update event',
        }, 500);
    }
}
