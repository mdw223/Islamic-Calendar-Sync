import EventDOA from '../../model/db/doa/EventDOA.js';
import { sanitizeDescription } from '../../util/SanitizeHtml.js';
import { validateStoredUserRRule } from '../../services/EventExpansionService.js';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

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

        if (req.body.description !== undefined) {
            req.body.description = sanitizeDescription(req.body.description);
        }

        if (req.body.rrule === '') {
            req.body.rrule = null;
        } else if (req.body.rrule !== undefined && req.body.rrule !== null) {
            const rr = validateStoredUserRRule(req.body.rrule);
            if (!rr.ok) {
                return res.status(400).json({
                    success: false,
                    message: rr.message,
                });
            }
            req.body.rrule = rr.value || null;
        }

        const userId = req.user.userId;

        const userEvent = await EventDOA.findById(eventId, userId);
        if (!userEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        if (userEvent.islamicDefinitionId) {
            req.body.islamicDefinitionId = userEvent.islamicDefinitionId;
        } else {
            req.body.islamicDefinitionId = null;
        }

        if (req.body.color != null) {
            if (typeof req.body.color !== "string" || !HEX_COLOR_RE.test(req.body.color)) {
                return res.status(400).json({
                    success: false,
                    message: '"color" must be a hex color string like #1A2B3C.',
                });
            }
            if (userEvent.islamicDefinitionId) {
                return res.status(400).json({
                    success: false,
                    message: "Definition-linked Islamic events inherit definition color and cannot set per-event color.",
                });
            }
        }

        const updated = await EventDOA.updateEvent(eventId, userId, req.body);
        return res.json({ success: true, event: updated });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to update event',
        });
    }
}
