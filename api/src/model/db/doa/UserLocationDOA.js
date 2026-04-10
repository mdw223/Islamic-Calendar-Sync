import { query } from "../../db/DBConnection.js";

export default class UserLocationDOA {
  static async findAllByUserId(userId) {
    const result = await query(
      `SELECT * FROM userlocation WHERE userid = $1 ORDER BY isdefault DESC, createdat ASC`,
      [userId],
    );
    return result.rows;
  }

  static async countByUserId(userId) {
    const result = await query(
      `SELECT COUNT(*)::int AS count FROM userlocation WHERE userid = $1`,
      [userId],
    );
    return result.rows[0]?.count ?? 0;
  }

  static async create(userId, data) {
    const result = await query(
      `INSERT INTO userlocation (userid, name, latitude, longitude, timezone, isdefault, createdat, updatedat)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [
        userId,
        data.name,
        data.latitude ?? null,
        data.longitude ?? null,
        data.timezone,
        data.isDefault ?? false,
      ],
    );
    return result.rows[0];
  }

  static async update(userId, userLocationId, data) {
    const updates = [];
    const values = [userLocationId, userId];
    let index = 3;
    const map = {
      name: "name",
      latitude: "latitude",
      longitude: "longitude",
      timezone: "timezone",
      isDefault: "isdefault",
    };

    for (const [key, value] of Object.entries(data)) {
      if (!Object.prototype.hasOwnProperty.call(map, key)) continue;
      updates.push(`${map[key]} = $${index++}`);
      values.push(value);
    }

    if (updates.length === 0) {
      const current = await query(
        `SELECT * FROM userlocation WHERE userlocationid = $1 AND userid = $2`,
        [userLocationId, userId],
      );
      return current.rows[0] ?? null;
    }

    const result = await query(
      `UPDATE userlocation
       SET ${updates.join(", ")}, updatedat = NOW()
       WHERE userlocationid = $1 AND userid = $2
       RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  static async delete(userId, userLocationId) {
    const result = await query(
      `DELETE FROM userlocation WHERE userlocationid = $1 AND userid = $2`,
      [userLocationId, userId],
    );
    return result.rowCount > 0;
  }

  static async clearDefault(userId) {
    await query(
      `UPDATE userlocation SET isdefault = FALSE, updatedat = NOW() WHERE userid = $1`,
      [userId],
    );
  }

  static async syncMany(userId, locations) {
    const existing = await this.countByUserId(userId);
    if (existing + locations.length > 3) {
      throw new Error("Users can save up to 3 locations.");
    }

    const inserted = [];
    for (const location of locations) {
      if (location.isDefault) {
        await this.clearDefault(userId);
      }
      const row = await this.create(userId, location);
      inserted.push(row);
    }
    return inserted;
  }
}

