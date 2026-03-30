import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
export default async function CreateUserLocation(req, res) {
  try {
    const { name, latitude = null, longitude = null, timezone, isDefault = false } = req.body ?? {};
    if (!name || !timezone) {
      return res.status(400).json({ success: false, message: "name and timezone are required." });
    }

    const count = await UserLocationDOA.countByUserId(req.user.userId);
    if (count >= 3) {
      return res.status(400).json({ success: false, message: "Users can save up to 3 locations." });
    }

    if (isDefault) {
      await UserLocationDOA.clearDefault(req.user.userId);
    }

    const userLocation = await UserLocationDOA.create(req.user.userId, {
      name,
      latitude,
      longitude,
      timezone,
      isDefault,
    });
    return res.status(201).json({ success: true, userLocation });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to create user location." });
  }
}

