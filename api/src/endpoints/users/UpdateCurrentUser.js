import UserDOA from "../../model/db/doa/UserDOA.js";
import { sendJson } from "../SendJson.js";

export default async function UpdateCurrentUser(req, res) {
  try {
    const { name, language, hanafi } = req.body ?? {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (language !== undefined) updates.language = language;
    if (hanafi !== undefined) updates.hanafi = !!hanafi;

    const user = await UserDOA.updateUser(req.user.userId, updates);
    return sendJson(res, { success: true, user });
  } catch {
    return sendJson(res, { success: false, message: "Failed to update user profile." }, 500);
  }
}

