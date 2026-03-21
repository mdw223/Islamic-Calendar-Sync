import UserLocationDOA from "../../model/db/doa/UserLocationDOA.js";
import { sendJson } from "../SendJson.js";

export default async function GetUserLocations(req, res) {
  try {
    const userLocations = await UserLocationDOA.findAllByUserId(req.user.userId);
    return sendJson(res, { success: true, userLocations });
  } catch {
    return sendJson(res, { success: false, message: "Failed to load user locations." }, 500);
  }
}

