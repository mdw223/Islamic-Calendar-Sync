import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
export default async function UpdateUserLocation(req, res) {
  try {
    const userLocationId = Number.parseInt(req.params.userLocationId, 10);
    if (Number.isNaN(userLocationId)) {
      return res.status(400).json({ success: false, message: "Invalid user location id." });
    }

    if (req.body?.isDefault === true) {
      await UserLocationDOA.clearDefault(req.user.userId);
    }

    const userLocation = await UserLocationDOA.update(
      req.user.userId,
      userLocationId,
      req.body ?? {},
    );

    if (!userLocation) {
      return res.status(404).json({ success: false, message: "User location not found." });
    }

    return res.json({ success: true, userLocation });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to update user location." });
  }
}

