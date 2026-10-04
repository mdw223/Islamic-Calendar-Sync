## JWT authentication implementation

This document describes how the API uses **passport-jwt** for authentication. JWTs are issued on login and are primarily read from the auth cookie (`token`), with `Authorization: Bearer` as a supported fallback. General API authentication is stateless (no persistent server-side login session). The only exception is a **temporary session** used during the Google OAuth redirect flow so the OIDC library can store state between the outbound redirect and the callback (see [Why session is used for Google OAuth](#why-session-is-used-for-google-oauth)).

### High-level behavior

- **Login issues a JWT**: After magic-link verification or Google OAuth, the server signs a JWT and sets it in the auth cookie (`token`).
- **`req.user` from JWT**: On every request, middleware extracts JWT from the cookie first, then falls back to `Authorization: Bearer <token>`, verifies it, loads the user from the database, and sets `req.user`. If no token or invalid token, `req.user` is left undefined.
- **AuthMiddleware**: Sets `req.userRoles` from `req.user` (or `ANY_USER` when unauthenticated). Route-level `Auth(roles)` enforces role checks. No `req.isAuthenticated()` or session.

### Why session is used for Google OAuth

We use **JWT for authentication** (Bearer token on each request). Session is **not** used for “is the user logged in?” — that is entirely JWT. Session is required only for the **Google OAuth redirect flow**:

1. **Outbound:** User hits `GET /auth/google/login`. The server redirects the browser to Google and sends a **state** (and possibly nonce) for CSRF protection. The OIDC library must **store that state** somewhere so it can verify the callback.
2. **Callback:** User signs in at Google; the browser is redirected back to `GET /auth/google/redirect?state=...&code=...`. The server must look up the state it stored in step 1 and verify it matches.

The library we use (`passport-openidconnect`, behind `passport-google-oidc`) stores that state in the **session** by default. So:

- **Session** = short-lived storage only for the OAuth handshake (one redirect out, one redirect back). It is not used for authenticating normal API requests.
- **JWT** = how we authenticate requests after login. No session is involved for that.

Without `express-session`, the OIDC strategy throws: *“OpenID Connect requires session support. Did you forget to use `express-session` middleware?”*

### Dependencies and configuration

- **Packages**: `passport`, `passport-jwt`, `passport-google-oidc`, `passport-magic-link`, `jsonwebtoken`, `cookie-parser`, `express-session` (session used only for Google OAuth redirect flow; see above).
- **Secret**: `jwtSecret` from `api/src/config.js` (env `JWT_SECRET` or `SESSION_SECRET`). Used to sign and verify JWTs with algorithm `HS256`. Session uses `SESSION_SECRET` or falls back to `JWT_SECRET` (see `sessionConfig` in `api/src/config.js`).
- **Token lifetime**: 7 days (configurable via `JWT_EXPIRY_DAYS` in `api/src/passport.js`).

### Issuing JWTs

- **`signToken(user)`** (exported from `api/src/Passport.js`):
  - Payload: `{ sub: user.userId }`.
  - Options: `algorithm: "HS256"`, `expiresIn: "7d"`.
  - Used by:
    - **GET /auth/google/redirect**: Signs JWT, sets auth cookie, redirects to frontend base URL.
    - **GET /auth/magiclink/verify**: Signs JWT and completes magic-link login flow.

### Validating JWTs on each request

- **JWT strategy** (in `api/src/Passport.js`):
  - **Extraction**: custom extractor reads cookie `token` first, then `Authorization: Bearer <token>`.
  - **Verification**: `secretOrKey: jwtSecret`, `algorithms: ["HS256"]`.
  - **Verify callback**: On success, `UserDOA.findById(payload.sub)` loads the user and calls `done(null, user)`; otherwise `done(null, false)` or `done(err)`.

- **JWT middleware** (`authenticateJwt`, in `api/src/Passport.js`):
  - Runs after `passport.initialize()` in `api/src/index.js`.
  - Calls `passport.authenticate("jwt", { session: false }, (err, user) => { req.user = user ?? undefined; next(); })`.
  - Never sends 401 directly: if token is missing/invalid, `req.user` is set to `undefined` and request continues. Protected routes then rely on `Auth(...)`.

### Middleware order in index.js

1. `express.json()`, `express.urlencoded()`, `cookieParser()`
2. `express-session` — scoped to Google OAuth routes for OIDC state; not used as app login session
3. `passport.initialize()`
4. `authenticateJwt` — sets `req.user` when a valid JWT is present (cookie or bearer)
5. `requestLogger`, `requestSanitizer`, `responseSanitizer`, route auth middleware
6. Routes, then `NotFoundMiddleware`, `ErrorHandlerMiddleware`

We do **not** use `passport.session()` or serialize the user into the session. Session is only used by the OIDC strategy to store OAuth state during the redirect flow.

### AuthMiddleware and authorization

- **AuthMiddleware**: Computes `req.userRoles` from `req.user` (bitmask: `ANY_USER`, `SUBSCRIBED_USER`, `ADMIN`; `SAME_USER` is added per-route by `Auth(allowedRoles)` when the path has `:userId` and it matches the current user).
- **Auth(allowedRoles)**: Ensures `req.userRoles` includes one of the allowed roles; otherwise responds with 403.
- **authenticateUser** (optional helper): Returns 401 if `!req.user`. Use when a route must require a logged-in user without caring about roles.

### Logout

- **POST /users/logout**: Clears auth cookie and logs out user. There is no persistent server-side login session to destroy (OAuth session is transient and only used during redirect state handling).

### Frontend / client contract

- Browser-based clients should rely on cookie auth.
- Non-browser/API clients may use `Authorization: Bearer <token>`.
- **Logout**: call `POST /users/logout`; server clears cookie.

### End-to-end flow summary

1. User logs in (Google OAuth or magic-link).
2. Server signs JWT and sets cookie `token`.
3. On each API request, `authenticateJwt` verifies cookie/bearer token.
4. User is loaded into `req.user`.
5. Protected routes enforce access via `Auth(...)`.

### Diagram

```mermaid
sequenceDiagram
  participant Browser
  participant API
  participant PassportJWT
  participant UserDOA

  Note over Browser,UserDOA: Login (Google OAuth or magic-link verify)
  Browser->>API: GET /auth/google/redirect or GET /auth/magiclink/verify
  API->>API: signToken(user)
  API->>Browser: Set-Cookie: token=<jwt>; redirect to APP_BASE_URL

  Note over Browser,UserDOA: Authenticated request
  Browser->>API: Request with cookie token (or Bearer token)
  API->>PassportJWT: authenticateJwt
  PassportJWT->>PassportJWT: Verify JWT, payload.sub
  PassportJWT->>UserDOA: findById(payload.sub)
  UserDOA-->>PassportJWT: user
  PassportJWT->>API: req.user = user
  API->>API: Auth(...) and route logic
  API->>Browser: Response
```