import { query } from "../../db/DBConnection.js";

export default class SubscriptionDefinitionSelectionDOA {
  static async replaceForToken(subscriptionTokenId, definitionIds) {
    const cleanDefinitionIds = Array.from(new Set(definitionIds ?? []));

    await query(
      `DELETE FROM subscriptiondefinitionselection
       WHERE subscriptiontokenid = $1`,
      [subscriptionTokenId],
    );

    if (cleanDefinitionIds.length === 0) {
      return [];
    }

    const values = cleanDefinitionIds
      .map((_, i) => `($1, $${i + 2})`)
      .join(", ");

    await query(
      `INSERT INTO subscriptiondefinitionselection (subscriptiontokenid, definitionid)
       VALUES ${values}`,
      [subscriptionTokenId, ...cleanDefinitionIds],
    );

    return cleanDefinitionIds;
  }

  static async findDefinitionIdsByTokenId(subscriptionTokenId) {
    const result = await query(
      `SELECT definitionid
       FROM subscriptiondefinitionselection
       WHERE subscriptiontokenid = $1
       ORDER BY definitionid ASC`,
      [subscriptionTokenId],
    );

    return result.rows.map((row) => row.definitionid);
  }

  static async findDefinitionIdsByTokenIds(subscriptionTokenIds) {
    if (!subscriptionTokenIds || subscriptionTokenIds.length === 0) {
      return new Map();
    }

    const result = await query(
      `SELECT subscriptiontokenid, definitionid
       FROM subscriptiondefinitionselection
       WHERE subscriptiontokenid = ANY($1::int[])
       ORDER BY subscriptiontokenid ASC, definitionid ASC`,
      [subscriptionTokenIds],
    );

    const map = new Map();
    for (const row of result.rows) {
      const tokenId = row.subscriptiontokenid;
      const list = map.get(tokenId) ?? [];
      list.push(row.definitionid);
      map.set(tokenId, list);
    }

    return map;
  }
}
