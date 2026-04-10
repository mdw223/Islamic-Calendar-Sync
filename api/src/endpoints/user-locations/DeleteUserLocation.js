import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
export default async function DeleteUserLocation(req, res) {
  try {
    const userLocationId = Number.parseInt(req.params.userLocationId, 10);
    if (Number.isNaN(userLocationId)) {
      return res.status(400).json({ success: false, message: "Invalid user location id." });
    }

    const deleted = await UserLocationDOA.delete(req.user.userId, userLocationId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "User location not found." });
    }

    return res.json({ success: true });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to delete user location." });
  }
}

