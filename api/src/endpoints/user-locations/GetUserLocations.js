import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
export default async function GetUserLocations(req, res) {
  try {
    const userLocations = await UserLocationDOA.findAllByUserId(req.user.userId);
    return res.json({ success: true, userLocations });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to load user locations." });
  }
}

