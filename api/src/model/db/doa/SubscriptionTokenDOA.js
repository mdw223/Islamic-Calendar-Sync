import { query } from "../../db/DBConnection.js";
import { SubscriptionToken } from "../../models/SubscriptionToken.js";

export default class SubscriptionTokenDOA {
  static async createToken({ userId, name = null, tokenHash, salt, createdAt }) {
    const result = await query(
      `INSERT INTO subscriptiontoken (userid, name, tokenhash, salt, createdat)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, name, tokenHash, salt, createdAt],
    );
    return SubscriptionToken.fromRow(result.rows[0]);
  }

  static async findActiveByUserIdAndHash(userId, tokenHash) {
    const result = await query(
      `SELECT *
       FROM subscriptiontoken
       WHERE userid = $1 AND tokenhash = $2`,
      [userId, tokenHash],
    );
    return SubscriptionToken.fromRow(result.rows[0] ?? null);
  }

  static async findActiveByUserId(userId) {
    const result = await query(
      `SELECT *
       FROM subscriptiontoken
       WHERE userid = $1
       ORDER BY createdat DESC`,
      [userId],
    );
    return result.rows.map((row) => SubscriptionToken.fromRow(row));
  }

  static async countActiveByUserId(userId) {
    const result = await query(
      `SELECT COUNT(*)::int AS count
       FROM subscriptiontoken
       WHERE userid = $1`,
      [userId],
    );
    return result.rows[0]?.count ?? 0;
  }

  static async revokeById(userId, subscriptionTokenId) {
    const result = await query(
      `DELETE FROM subscriptiontoken
       WHERE userid = $1 AND subscriptiontokenid = $2
       RETURNING *`,
      [userId, subscriptionTokenId],
    );
    return SubscriptionToken.fromRow(result.rows[0] ?? null);
  }

  static async updateNameById(userId, subscriptionTokenId, name) {
    const result = await query(
      `UPDATE subscriptiontoken
       SET name = $3
       WHERE userid = $1 AND subscriptiontokenid = $2
       RETURNING *`,
      [userId, subscriptionTokenId, name],
    );
    return SubscriptionToken.fromRow(result.rows[0] ?? null);
  }
}
