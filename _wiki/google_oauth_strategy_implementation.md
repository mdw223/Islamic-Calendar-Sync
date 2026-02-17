# Google OAuth Strategy and Authentication

This document describes how Google OAuth2 is integrated with Passport.js and how it works with the application's JWT-based authentication. For the overall JWT flow (issuing, validating, logout), see [jwt_implementation.md](jwt_implementation.md).

---

## Overview

- The API uses **passport-google-oidc** for the Google OAuth2 authorization code flow.
- After a successful callback, the server does **not** create a session. It issues an **application JWT** and redirects the browser to the frontend with the token in the URL **hash** (`#token=<jwt>`).
- The frontend reads the token from the hash, stores it, and sends `Authorization: Bearer <token>` on all authenticated API requests.
- Google OAuth **access and refresh tokens** are stored in the database (PROVIDER table) and used only for calling Google APIs (e.g. Calendar). They are separate from the application JWT used for API authentication.

---

## Backend components

### Passport configuration (`api/src/passport.js`)

- **Google strategy** (`passport-google-oidc`):
  - Configured with `clientID`, `clientSecret`, `callbackURL` from `googleAuthConfig` (env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`).
  - `passReqToCallback: true` so the verify callback can attach data to `req` for the redirect handler.
  - **Verify callback**: Receives `(req, issuer, profile, context, idToken, accessToken, refreshToken, params, verified)`. It calls `findOrCreateUserFromGoogleProfile(profile, tokens)` to get or create the user and provider, attaches `req.googleTokens` and `req.googleProvider`, and calls `verified(null, user)`.

- **Redirect handler** (after `passport.authenticate("google", { session: false })`):
  1. Reads `req.user`, `req.googleTokens`, `req.googleProvider`.
  2. Updates the provider row with Google tokens (access, refresh, expiry, scopes) via `ProviderDOA.updateTokens`.
  3. Calls `signToken(user)` to create a JWT (payload `{ sub: user.userId }`, 7-day expiry).
  4. Redirects to `{APP_BASE_URL}#token={jwt}` so the frontend can read the token from the hash.

- **Routes**:
  - `GET /auth/google/login` — starts the flow (redirects to Google).
  - `GET /auth/google/redirect` — OAuth callback; stores Google tokens, issues JWT, redirects with `#token=...`.

### User and provider persistence

- **findOrCreateUserFromGoogleProfile** (`api/src/endpoints/users/GetUser.js`): Finds or creates the USERS row by email, finds or creates the PROVIDER row for Google, updates tokens and last login. Used only from the Passport verify callback.
- **ProviderDOA**: Manages the PROVIDER table (create provider, find by user and type, update tokens).
- **UserDOA**: User lookup by email or id, user creation, last login update.

---

## Frontend responsibilities

- **Start login**: Redirect the user to `GET /api/auth/google/login` (or your API base + `/auth/google/login`).
- **After redirect**: The browser lands on `{BASE_URL}#token=eyJ...`. The frontend must:
  1. Read the token from `window.location.hash` (e.g. parse `#token=...`).
  2. Store the token (e.g. in memory or localStorage).
  3. Remove the hash from the URL so the user does not see or share it.
- **Authenticated requests**: Send `Authorization: Bearer <token>` on every request to protected endpoints (e.g. `GET /users/me`).
- **Logout**: Call `POST /users/logout` and then discard the stored token locally.

---

## Google Cloud Console setup

1. **OAuth 2.0 Client ID** (Web application).
2. **Authorized redirect URIs**: Must match the callback URL exactly (e.g. `http://localhost:5000/api/auth/google/redirect` for dev, or your production API URL + `/auth/google/redirect`).
3. **Authorized JavaScript origins**: Your frontend origin (e.g. `http://localhost:5000` or your production app URL).

Environment variables used by the API:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect
APP_BASE_URL=http://localhost:5000
```

---

## End-to-end flow

1. User clicks “Login with Google” → browser goes to `GET /auth/google/login`.
2. Backend redirects to Google with `scope` (profile, email, calendar), `accessType: "offline"`, `prompt: "consent"`.
3. User signs in and consents → Google redirects to `GET /auth/google/redirect?code=...`.
4. Passport exchanges the code for access and refresh tokens.
5. Verify callback: `findOrCreateUserFromGoogleProfile`; user and provider are attached to `req`.
6. Redirect handler: save Google tokens to DB, `signToken(user)`, redirect to `{APP_BASE_URL}#token={jwt}`.
7. Frontend reads token from hash, stores it, calls `GET /users/me` with `Authorization: Bearer <token>`.

---

## Why the app issues its own JWT

Google’s access token is for calling Google APIs (Calendar, etc.), not for identifying the user to this application. The API therefore issues its own JWT with a short payload (`sub: userId`) and controlled expiry (e.g. 7 days). That JWT is what the client sends on each request; the backend validates it with passport-jwt and loads `req.user`. See [jwt_implementation.md](jwt_implementation.md).

---

## Token summary

| Token / storage        | Where                | Purpose                                      |
|------------------------|----------------------|----------------------------------------------|
| Google access/refresh  | PROVIDER table       | Call Google Calendar API (and other Google APIs). |
| Application JWT        | Redirect hash → client | Authenticate requests to this API (`Authorization: Bearer`). |

---

## Key implementation details

- **accessType: "offline"** and **prompt: "consent"** are used so Google returns a refresh token when possible.
- If Google does not return a new refresh token on a later login, the existing refresh token in the provider row is kept (see `findOrCreateUserFromGoogleProfile` / token update logic).
- OAuth or verify failures redirect to the login URL with an error query parameter (e.g. `?error=oauth_failed`).
- The callback URL in Google Cloud must match `GOOGLE_CALLBACK_URL` exactly (including path and, in production, scheme and host).
