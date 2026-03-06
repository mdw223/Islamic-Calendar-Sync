import ProviderDOA from '../../model/db/doa/ProviderDOA.js';
import { sendJson } from '../SendJson.js';

/**
 * GET /providers
 * Get all calendar providers linked to the current user.
 * Sensitive token/salt fields are stripped by Provider.toJSON().
 */
export default async function GetProviders(req, res) {
    try {
        const providers = await ProviderDOA.findAllByUserId(req.user.userId);

        return sendJson(res, {
            success: true,
            providers: providers,
        });
    } catch (error) {
        return sendJson(res, {
            success: false,
            message: 'Failed to get providers',
        }, 500);
    }
}
