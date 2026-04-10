export class SubscriptionToken {
  constructor() {
    this.subscriptionTokenId = null;
    this.userId = null;
    this.name = null;
    this.tokenHash = null;
    this.salt = null;
    this.createdAt = null;
  }

  static fromRow(row) {
    if (row == null) return null;
    const token = new SubscriptionToken();
    token.subscriptionTokenId = row.subscriptiontokenid;
    token.userId = row.userid;
    token.name = row.name ?? null;
    token.tokenHash = row.tokenhash;
    token.salt = row.salt;
    token.createdAt = row.createdat;
    return token;
  }

  toJSON() {
    return {
      subscriptionTokenId: this.subscriptionTokenId,
      userId: this.userId,
      name: this.name,
      createdAt: this.createdAt,
    };
  }
}
