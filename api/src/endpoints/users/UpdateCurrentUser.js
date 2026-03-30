import UserDOA from "../../model/db/doa/UserDOA.js";
export default async function UpdateCurrentUser(req, res) {
  try {
    const { name, language, hanafi, use24HourTime } = req.body ?? {};
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (language !== undefined) updates.language = language;
    if (hanafi !== undefined) updates.hanafi = !!hanafi;
    if (use24HourTime !== undefined)
      updates.use24hourtime = !!use24HourTime;

    const user = await UserDOA.updateUser(req.user.userId, updates);
    return res.json({ success: true, user });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to update user profile." });
  }
}

