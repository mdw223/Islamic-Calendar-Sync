# Subscription URL tokens

This document describes how **subscription feed URLs** authenticate requests. These URLs let calendar clients fetch events without a session cookie; the secret is carried in the query string as a JWT.

## What is stored in the database

The API does **not** store the raw JWT string. For each subscription URL it stores:

| Field | Role |
|--------|------|
| **salt** | Per-URL random value (hex string). It participates in both JWT signing and password-style hashing. |
| **tokenHash** | `PBKDF2-SHA256` output (32 bytes): derived from the **full JWT string** and this row’s **salt** (10 000 iterations). Used to recognize a valid token without keeping the JWT in the database. |
| **userId**, name, createdAt, etc. | Ownership and display metadata. |

If the row is deleted (revoked), the same JWT string will no longer match any stored hash.

## Creating a URL (`CreateSubscriptionUrl`)

1. Generate a random **salt** (8 bytes, hex).
2. Build a JWT: `jwt.sign({ userId }, API_SECRET + salt)` — see `GenerateToken` in `api/src/middleware/AuthMiddleware.js`.
3. Compute **tokenHash** = `HashToken(jwtString, salt)` (PBKDF2).
4. Insert **salt** and **tokenHash** (and metadata) via `SubscriptionTokenDOA.createToken`.
5. Return the **full JWT** to the client once (in `subscriptionUrl`). That string is what gets bookmarked in calendar apps.

The JWT is **reproducible** later because signing uses only `userId` and `API_SECRET + salt`, both known from the database row.

## Listing URLs in the UI (`GetSubscriptionUrls`)

The raw JWT is not stored, so the API **re-signs** a JWT for each active row:

`jwt.sign({ userId }, API_SECRET + subscription.salt)`

That yields the same token string as at creation (same payload and secret), so the displayed `subscriptionUrl` stays valid.

## Validating a request (`RequireSubscriptionToken`)

Used for routes such as `GET /api/subscription/events?token=...`.

1. Read **token** from the query string.
2. **`jwt.decode`** (no signature check yet) to read **userId** from the payload. This is only a hint for lookup; a forged payload is rejected later by verify + hash check.
3. Load **all** active subscription rows for that **userId** (`findActiveByUserId`). Multiple URLs per user each have a different **salt**, so the correct row is found by **trying each salt**:
   - Compute `candidateHash = HashToken(token, row.salt)`.
   - Compare to **row.tokenHash** with **`crypto.timingSafeEqual`** (after normalizing the DB value to a `Buffer` so the comparison API is safe and types match).
4. If no row matches, the token is unknown or revoked → 403.
5. **`jwt.verify(token, API_SECRET + subscription.salt)`** — confirms the JWT signature matches this row’s secret and that the payload was not tampered with.
6. Load the user, set `req.user` and `req.subscriptionToken`, then continue.

**Why iterate rows?** The PBKDF2 hash depends on **this URL’s salt**. Until you know which subscription row applies, you cannot compute a single hash and query `WHERE userid AND tokenhash` without either trying each salt or storing an extra lookup key (for example a `jti` in the JWT). The implementation matches by scanning that user’s subscriptions (bounded by `MAX_ACTIVE_URLS`).

## Security properties (short)

- **Database leak**: Attackers get salts and slow hashes of JWTs, not JWTs themselves. They still need `API_SECRET` to forge new JWTs.
- **Revocation**: Deleting the row removes the hash match; old URLs stop working.
- **Comparison**: `timingSafeEqual` reduces timing leakage when comparing derived hashes.

For local testing and tunnels (e.g. ngrok), see [subscription_testing.md](./subscription_testing.md).
