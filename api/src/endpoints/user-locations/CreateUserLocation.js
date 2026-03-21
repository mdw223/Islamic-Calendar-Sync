import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
import { sendJson } from "../SendJson.js";

export default async function CreateUserLocation(req, res) {
  try {
    const { name, latitude = null, longitude = null, timezone, isDefault = false } = req.body ?? {};
    if (!name || !timezone) {
      return sendJson(res, { success: false, message: "name and timezone are required." }, 400);
    }

    const count = await UserLocationDOA.countByUserId(req.user.userId);
    if (count >= 3) {
      return sendJson(res, { success: false, message: "Users can save up to 3 locations." }, 400);
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
    return sendJson(res, { success: true, userLocation }, 201);
  } catch {
    return sendJson(res, { success: false, message: "Failed to create user location." }, 500);
  }
}

