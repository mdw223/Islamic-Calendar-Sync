import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
import { sendJson } from "../SendJson.js";

export default async function UpdateUserLocation(req, res) {
  try {
    const userLocationId = Number.parseInt(req.params.userLocationId, 10);
    if (Number.isNaN(userLocationId)) {
      return sendJson(res, { success: false, message: "Invalid user location id." }, 400);
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
      return sendJson(res, { success: false, message: "User location not found." }, 404);
    }

    return sendJson(res, { success: true, userLocation });
  } catch {
    return sendJson(res, { success: false, message: "Failed to update user location." }, 500);
  }
}

