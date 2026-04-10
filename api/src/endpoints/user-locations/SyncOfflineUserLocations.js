import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
export default async function SyncOfflineUserLocations(req, res) {
  try {
    const userLocations = req.body?.userLocations;
    if (!Array.isArray(userLocations)) {
      return res.status(400).json({ success: false, message: "userLocations must be an array." });
    }
    if (userLocations.length === 0) {
      return res.json({ success: true, syncedCount: 0 });
    }

    const normalized = userLocations.map((location) => ({
      name: location?.name ?? "",
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      timezone: location?.timezone ?? null,
      isDefault: location?.isDefault ?? false,
    }));

    if (normalized.some((location) => !location.name || !location.timezone)) {
      return res.status(400).json({ success: false, message: "Each location requires name and timezone." });
    }

    const inserted = await UserLocationDOA.syncMany(req.user.userId, normalized);
    return res.json({ success: true, syncedCount: inserted.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message ?? "Failed to sync user locations." });
  }
}

