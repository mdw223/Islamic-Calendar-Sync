import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
import { sendJson } from "../SendJson.js";

export default async function SyncOfflineUserLocations(req, res) {
  try {
    const userLocations = req.body?.userLocations;
    if (!Array.isArray(userLocations)) {
      return sendJson(res, { success: false, message: "userLocations must be an array." }, 400);
    }
    if (userLocations.length === 0) {
      return sendJson(res, { success: true, syncedCount: 0 });
    }

    const normalized = userLocations.map((location) => ({
      name: location?.name ?? "",
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      timezone: location?.timezone ?? null,
      isDefault: location?.isDefault ?? false,
    }));

    if (normalized.some((location) => !location.name || !location.timezone)) {
      return sendJson(res, { success: false, message: "Each location requires name and timezone." }, 400);
    }

    const inserted = await UserLocationDOA.syncMany(req.user.userId, normalized);
    return sendJson(res, { success: true, syncedCount: inserted.length });
  } catch (error) {
    return sendJson(res, { success: false, message: error.message ?? "Failed to sync user locations." }, 500);
  }
}

