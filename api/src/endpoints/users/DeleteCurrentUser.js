import UserDOA from "../../model/db/doa/UserDOA.js";

export default async function DeleteCurrentUser(req, res) {
  try {
    const deleted = await UserDOA.deleteUser(req.user.userId);
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    return res.status(204).send();
  } catch {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete account." });
  }
}
