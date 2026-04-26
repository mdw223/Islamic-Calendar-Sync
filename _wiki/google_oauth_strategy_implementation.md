# Google OAuth Strategy and Authentication

This document describes how Google OAuth2 is integrated with Passport.js and how it works with the application's JWT-based authentication. For the overall JWT flow (issuing, validating, logout), see [jwt_implementation.md](jwt_implementation.md).

---

## Overview

- The API uses **passport-google-oidc** for the Google OAuth2 authorization code flow.
- After a successful callback, the server does **not** create a persistent login session. It issues an **application JWT**, sets it as the auth cookie (`token`), and redirects to the frontend base URL.
- Browser auth then proceeds via secure httpOnly cookie; bearer token remains a supported fallback in backend JWT extractor.
- In the current codebase, Google OAuth tokens are not persisted for Calendar API usage; Google is used for identity/login.

---

## Backend components

### Passport configuration (`api/src/Passport.js`)

- **Google strategy** (`passport-google-oidc`):
  - Configured with `clientID`, `clientSecret`, `callbackURL` from `googleAuthConfig` (env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`).
  - `passReqToCallback: true` so the verify callback can attach data to `req` for the redirect handler.
  - **Verify callback**: Receives `(req, issuer, profile, context, idToken, accessToken, refreshToken, params, verified)`. It calls `findOrCreateUserFromGoogleProfile(profile, tokens)` to get or create the user and provider, attaches `req.googleTokens` and `req.googleProvider`, and calls `verified(null, user)`.

- **Redirect handler** (after `passport.authenticate("google", { session: false })`):
  1. Reads `req.user`, `req.googleTokens`, `req.googleProvider`.
  2. Calls `signToken(user)` to create a JWT (payload `{ sub: user.userId }`, configured expiry).
  3. Sets cookie `token` using shared auth cookie options.
  4. Redirects to `{APP_BASE_URL}`.

- **Routes**:
  - `GET /auth/google/login` — starts the flow (redirects to Google).
  - `GET /auth/google/redirect` — OAuth callback; issues JWT cookie and redirects to frontend.

### User persistence

- **findOrCreateUserFromGoogleProfile** (`api/src/Passport.js`): finds or creates user by email and updates last login metadata.
- **UserDOA** handles user lookup/create/update.

---

## Frontend responsibilities

- **Start login**: Redirect the user to `GET /api/auth/google/login` (or your API base + `/auth/google/login`).
- **After redirect**: Browser lands on `{APP_BASE_URL}` already authenticated via cookie.
- **Authenticated requests**: Browser sends cookie automatically to same-site API endpoints; backend also supports bearer header for non-browser clients.
- **Logout**: call `POST /users/logout`; server clears auth cookie.

---

## Google Cloud Console setup

1. **OAuth 2.0 Client ID** (Web application).
2. **Authorized redirect URIs**: Must match callback exactly (e.g. `http://localhost:5000/api/auth/google/redirect` for dev; `https://api.yourdomain.com/api/auth/google/redirect` for split production).
3. **Authorized JavaScript origins**: frontend origin (e.g. `http://localhost:5000`, `https://www.yourdomain.com`).

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
6. Redirect handler: `signToken(user)`, set auth cookie, redirect to `{APP_BASE_URL}`.
7. Frontend calls authenticated endpoints (for example `GET /users/me`) with cookie auth.

---

## Why the app issues its own JWT

Google identity proves who the user is during OAuth callback, but ongoing app authorization is handled by the app's own JWT (`sub: userId`) validated by `passport-jwt`. See [jwt_implementation.md](jwt_implementation.md).

---

## Token summary

| Token / storage        | Where                         | Purpose                                      |
|------------------------|-------------------------------|----------------------------------------------|
| Google OAuth tokens    | OAuth callback context        | Identity handshake during login flow.        |
| Application JWT        | `token` secure httpOnly cookie | Authenticate requests to this API.           |

---

## Key implementation details

- **accessType: "offline"** and **prompt: "consent"** are used so Google returns a refresh token when possible.
- OAuth or verify failures redirect to login with an error query parameter.
- OAuth or verify failures redirect to the login URL with an error query parameter (e.g. `?error=oauth_failed`).
- The callback URL in Google Cloud must match `GOOGLE_CALLBACK_URL` exactly (including path and, in production, scheme and host).
