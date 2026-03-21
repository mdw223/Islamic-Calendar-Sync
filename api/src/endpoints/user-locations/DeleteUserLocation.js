import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
import { sendJson } from "../SendJson.js";

export default async function DeleteUserLocation(req, res) {
  try {
    const userLocationId = Number.parseInt(req.params.userLocationId, 10);
    if (Number.isNaN(userLocationId)) {
      return sendJson(res, { success: false, message: "Invalid user location id." }, 400);
    }

    const deleted = await UserLocationDOA.delete(req.user.userId, userLocationId);
    if (!deleted) {
      return sendJson(res, { success: false, message: "User location not found." }, 404);
    }

    return sendJson(res, { success: true });
  } catch {
    return sendJson(res, { success: false, message: "Failed to delete user location." }, 500);
  }
}

