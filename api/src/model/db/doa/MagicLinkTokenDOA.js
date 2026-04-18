import { getConnection, query } from "../../db/DBConnection.js";

export default class MagicLinkTokenDOA {
  static async replaceUserTokens(userUid, usedTokensRecord) {
    const connection = await getConnection();
    try {
      await connection.query("BEGIN");

      await connection.query(
        `DELETE FROM magiclinkusedtoken WHERE useruid = $1`,
        [userUid],
      );

      const entries = Object.entries(usedTokensRecord || {});
      for (const [token, expiresAt] of entries) {
        await connection.query(
          `INSERT INTO magiclinkusedtoken (useruid, token, expiresat)
           VALUES ($1, $2, $3)`,
          [userUid, token, Number(expiresAt)],
        );
      }

      await connection.query(
        `DELETE FROM magiclinkusedtoken
         WHERE expiresat <= EXTRACT(EPOCH FROM NOW())::bigint`,
      );

      await connection.query("COMMIT");
    } catch (err) {
      await connection.query("ROLLBACK");
      throw err;
    } finally {
      connection.release();
    }
  }

  static async getUserTokens(userUid) {
    await query(
      `DELETE FROM magiclinkusedtoken
       WHERE expiresat <= EXTRACT(EPOCH FROM NOW())::bigint`,
    );

    const result = await query(
      `SELECT token, expiresat
       FROM magiclinkusedtoken
       WHERE useruid = $1`,
      [userUid],
    );

    if (!result.rows.length) {
      return undefined;
    }

    return result.rows.reduce((acc, row) => {
      acc[row.token] = Number(row.expiresat);
      return acc;
    }, {});
  }

  static async deleteUserTokens(userUid) {
    const result = await query(
      `DELETE FROM magiclinkusedtoken WHERE useruid = $1`,
      [userUid],
    );
    return result.rowCount > 0;
  }
}
