## Google OAuth & User Context Wiring

This change set wires together the frontend contexts with a Passport.js-based Google OAuth2 flow on the backend, while keeping database access encapsulated in DAOs.

### Frontend

- **User context**: `UserContext` is the single source of truth for the logged-in user. The login page now calls `login()` from this context instead of hardcoding a user object.
- **Auth context**: `AuthContextProvider` uses `APIClient.getCurrentUser()` (which calls `/users/me`) to fetch the authenticated user from the backend on app load.
- **App wiring**: `App.jsx` wraps the router with both `UserProvider` and `AuthContextProvider`, so all routed components can access the shared `AuthContext`/`UserContext` from `Context.jsx` and `UserContext.jsx`.
- **API client**: `APIClient.getCurrentUser()` now uses a relative `/users/me` endpoint and `HTTPClient`’s base URL, and exposes `getGoogleLoginUrl()` so the login page can redirect to the backend OAuth entrypoint.
- **Login page**: The Google button now redirects to `APP_API_URL/auth/google/login` using `APIClient.getGoogleLoginUrl()`, making it the single entry point into the Google OAuth2 flow.

### Backend

- **DB connection**: `DBConnection.js` is now an ES module exporting `query`, `getConnection`, and `pool` for use in DAOs.
- **UserDAO**: `UserDOA.js` has been rewritten to use PostgreSQL via `query()`, with methods for:
  - Looking up users by email or ID
  - Creating a new user with `Email` and `Name`
  - Updating arbitrary fields (including `LastLogin`, language, event/prayer configurations, calculation method, Hanafi flag, and salt) following the schema in the wiki.
- **Provider / ProviderType**:
  - `ProviderDOA.js` encapsulates CRUD for the `PROVIDER` table (creating providers, finding by user+type, updating tokens/expiry/flags) per the wiki schema.
  - `ProviderTypeDOA.js` provides simple lookup methods for the `PROVIDER_TYPE` table.
  - `ProviderType.js` defines an enum-like mapping for `ProviderTypeId` (Google, Microsoft, Apple, Cal.com), corresponding to the `PROVIDER_TYPE` table (you should ensure these IDs exist in the database).
- **Google API client**:
  - `GoogleApiClient.js` now coordinates user/provider persistence: given a Google profile, it finds or creates the `USERS` row and ensures a `PROVIDER` row exists for the Google provider type, then updates `LastLogin`.
  - It does **not** execute raw SQL; it uses `UserDAO` and `ProviderDAO` exclusively.
- **Passport.js Google OAuth**:
  - `GoogleAuth.js` is a pure ES module that registers a `passport-google-oidc` `GoogleStrategy`, delegating to `GoogleApiClient.findOrCreateUserFromGoogleProfile()` in the strategy verify callback.
  - On successful callback (`/auth/google/redirect`), it signs a JWT containing `userId`, sets it as an HTTP-only cookie (`token`), and redirects back to the frontend base URL (`APP_BASE_URL` or `http://localhost:5000`).
  - It exposes two routes under `/auth/google`:
    - `GET /auth/google/login` → starts the Google OAuth2 flow.
    - `GET /auth/google/redirect` → handles the callback and issues the JWT cookie.
- **Routing & middleware**:
  - `Routes.js` now mounts the Google router with `router.use("/auth/google", GoogleAuthRouter)` and continues to use `AuthMiddleware` for `/users/me` and secure user routes.
  - `index.js` initializes `passport`, uses `cookie-parser`, and mounts all routes; `AuthMiddleware` reads the `token` cookie to authenticate users.

### Why this design?

- **Separation of concerns**: Passport’s Google strategy is responsible only for authentication and delegating to `GoogleApiClient`; all SQL is isolated in DAOs (`UserDOA`, `ProviderDOA`, `ProviderTypeDOA`) using the shared `DBConnection`.
- **Schema alignment**: The DAOs and models follow the `USERS`, `PROVIDER`, and `PROVIDER_TYPE` schemas defined in `_wiki/entity_overview_and_design.md`, making it straightforward to reason about columns and future migrations.
- **Clean frontend integration**: The login page and contexts don’t need to know about OAuth details; they only work with `/users/me` and a single Google login URL, while the backend handles JWT issuance and cookie-based auth for protected routes.

---

Explaining how cookies work in this flow and why we set them manually:


## Why we manually set cookies

Browsers don't create cookies automatically. They only store cookies sent by the server via `Set-Cookie` headers.

### The cookie flow

1. Server sets the cookie (lines 63-68 in `GoogleAuth.js`):
   ```javascript
   res.cookie("token", token, {
     httpOnly: true,        // JavaScript can't read this (security)
     secure: process.env.NODE_ENV === "production",  // HTTPS only in prod
     sameSite: "lax",       // CSRF protection
     maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
   });
   ```
   This sends a `Set-Cookie` header in the HTTP response.

2. Browser stores it: The browser stores the cookie and automatically includes it in future requests to your domain via the `Cookie` header.

3. Server reads it (line 12 in `AuthMiddleware.js`):
   ```javascript
   const token = req.cookies?.token;
   ```
   The browser sends cookies automatically, but Express needs middleware to parse the `Cookie` header into `req.cookies`.

### Why `cookie-parser` is needed

`cookie-parser` is middleware that parses the `Cookie` header into `req.cookies`. Without it, `req.cookies` would be `undefined`.

```javascript
// In index.js
app.use(cookieParser());  // This parses "Cookie: token=abc123" → req.cookies.token = "abc123"
```

### Why not use localStorage or sessionStorage?

- Security: `httpOnly: true` prevents JavaScript from reading the token, reducing XSS risk.
- Automatic sending: Cookies are sent automatically with requests; localStorage requires manual code.
- Same-origin: Cookies respect `sameSite` for CSRF protection.

### Why we create our own JWT

After Google OAuth, we issue our own JWT (lines 57-61) because:
- Google's tokens are for Google APIs, not your app.
- We need a token that identifies the user in your system.
- We control the payload (e.g., `userId`) and expiration.

---

## Complete Google OAuth2 Flow & Implementation

### Overview

This implementation uses **Passport.js with `passport-google-oidc`** to handle the complete OAuth2 authorization code flow. The flow captures Google's access tokens and refresh tokens, stores them in the database, and issues our own JWT for app authentication.

### Google Cloud Console Configuration

**Required Setup:**

1. **Create OAuth 2.0 Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" → "Credentials"
   - Create "OAuth 2.0 Client ID" (Web application type)

2. **Configure Authorized Redirect URIs:**
   - Development: `http://localhost:YOUR_API_PORT/auth/google/redirect`
   - Production: `https://yourdomain.com/auth/google/redirect`
   - **Important:** The path must match exactly (`/auth/google/redirect`)

3. **Configure Authorized JavaScript Origins:**
   - Development: `http://localhost:5000` (nginx proxy port)
   - Production: `https://yourdomain.com`

4. **Set Environment Variables:**
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### Complete OAuth Flow (Step-by-Step)

#### Step 1: User Initiates Login
```
User clicks "Google" button → Frontend calls APIClient.getGoogleLoginUrl()
→ Redirects to: GET /auth/google/login
```

#### Step 2: Redirect to Google
```
Backend (GoogleAuth.js) calls passport.authenticate("google", {
  scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
  accessType: "offline",  // REQUIRED for refresh tokens
  prompt: "consent"        // Forces consent screen
})
→ User is redirected to Google's OAuth consent screen
```

**Key Parameters:**
- `accessType: "offline"` - **Required** to receive refresh tokens
- `prompt: "consent"` - Forces consent screen (ensures refresh token on every login)
- `scope` - Permissions requested (profile, email, calendar access)

#### Step 3: User Grants Permission
```
User authenticates with Google → User grants permissions
→ Google redirects back to: GET http://localhost:5000/api/auth/google/redirect?code=AUTHORIZATION_CODE
  (nginx proxy receives this, rewrites to /auth/google/redirect, forwards to backend)
```

Google sends an **authorization code** (not tokens yet) in the query string.
**Note:** The callback URL from Google's perspective is `http://localhost:5000/api/auth/google/redirect` (via nginx), but the backend receives `/auth/google/redirect` after nginx rewrite.

#### Step 4: Passport Exchanges Code for Tokens
```
Passport middleware intercepts /auth/google/redirect
→ Passport automatically exchanges authorization code for tokens:
   POST https://oauth2.googleapis.com/token
   {
     code: AUTHORIZATION_CODE,
     client_id: GOOGLE_CLIENT_ID,
     client_secret: GOOGLE_CLIENT_SECRET,
     redirect_uri: "/auth/google/redirect",
     grant_type: "authorization_code"
   }
→ Google responds with:
   {
     access_token: "ya29.a0...",
     refresh_token: "1//0g...",  // Only if accessType: "offline"
     expires_in: 3599,
     token_type: "Bearer",
     scope: "profile email https://www.googleapis.com/auth/calendar",
     id_token: "eyJ..."
   }
```

**Important:** Passport handles this exchange automatically. We don't write this code ourselves.

#### Step 5: Verify Callback Receives Tokens
```
Passport calls our verify callback (in GoogleAuth.js):
  async (req, issuer, profile, tokens, cb) => {
    // tokens = { access_token, refresh_token?, expires_in, scope, ... }
    // profile = { emails: [...], displayName: "...", ... }
    
    const { user, provider } = 
      await GoogleAPIClient.findOrCreateUserFromGoogleProfile(profile, tokens);
    
    req.googleTokens = tokens;      // Store for redirect handler
    req.googleProvider = provider;  // Store for redirect handler
    cb(null, user);
  }
```

**What happens here:**
1. `GoogleAPIClient.findOrCreateUserFromGoogleProfile()` is called with `profile` and `tokens`
2. User is found/created in `USERS` table
3. Provider row is found/created in `PROVIDER` table
4. **Tokens are stored/updated in PROVIDER table:**
   - `accessToken` → `accesstoken` column
   - `refreshToken` → `refreshtoken` column (preserved if not provided)
   - `expiresAt` → calculated from `expires_in`
   - `scopes` → `scopes` column
5. Tokens attached to `req` for use in redirect handler

#### Step 6: Redirect Handler Stores Tokens & Issues JWT
```
Redirect handler (async function) runs:
  1. Retrieves tokens from req.googleTokens
  2. Updates provider tokens in database (if needed)
  3. Issues our own JWT: jwt.sign({ userId: user.userid }, ...)
  4. Sets JWT as HTTP-only cookie
  5. Redirects to frontend: res.redirect(APP_BASE_URL)
```

**Two Types of Tokens:**

1. **Google OAuth Tokens** (stored in `PROVIDER` table):
   - `access_token` - Used to call Google Calendar API (expires in ~1 hour)
   - `refresh_token` - Used to get new access tokens (long-lived, only provided with `accessType: "offline"`)
   - These are for **Google API calls** (e.g., creating calendar events)

2. **Our App JWT** (stored as cookie):
   - Contains `{ userId: user.userid }`
   - Used for **app authentication** (identifying user in our system)
   - Sent automatically with requests via cookie

#### Step 7: Frontend Receives User
```
Frontend receives redirect → Cookie is automatically set
→ AuthContext calls APIClient.getCurrentUser()
→ Backend reads JWT from cookie → Returns user data
→ UserContext is populated → User is logged in
```

**Note:** The cookie is set for the domain `localhost:5000` (or your domain), so it's automatically sent with subsequent API requests to `/api/*`.

### Token Storage & Usage

**Google Tokens (PROVIDER table):**
- Stored when OAuth completes
- Used later to call Google Calendar API
- Refresh token preserved across logins (only provided on first consent or with `prompt: "consent"`)
- Access token expires; refresh token used to get new access tokens

**App JWT (Cookie):**
- Set as HTTP-only cookie after OAuth
- Used for all protected routes (`/users/me`, etc.)
- Validated by `AuthMiddleware` on each request
- Separate from Google tokens (different purpose)

### Code Flow Diagram

```
Frontend                    Nginx Proxy              Backend                    Google
   │                          │                          │                          │
   │── GET /api/auth/google/login │                      │                          │
   │──────────────────────────>│                          │                          │
   │                          │── GET /auth/google/login │                          │
   │                          │──────────────────────────>│                          │
   │                          │                          │── GET /oauth2/auth ──────>│
   │                          │                          │  (redirect_uri:          │
   │                          │                          │   localhost:5000/api/...)│
   │                          │                          │                          │
   │                          │                          │<─── Redirect with code ──│
   │                          │                          │                          │
   │                          │<─── GET /api/auth/google/redirect?code=...         │
   │                          │                          │                          │
   │                          │── GET /auth/google/redirect?code=...                │
   │                          │──────────────────────────>│                          │
   │                          │                          │── POST /token ───────────>│
   │                          │                          │  (exchange code)          │
   │                          │                          │                          │
   │                          │                          │<─── access_token ────────│
   │                          │                          │    refresh_token         │
   │                          │                          │                          │
   │                          │                          │── verify callback ───────│
   │                          │                          │  (store tokens in DB)     │
   │                          │                          │                          │
   │<─── Redirect + Cookie ────│<─── Redirect + Cookie ───│                          │
   │    (JWT token)           │    (JWT token)           │                          │
   │                          │                          │                          │
   │── GET /api/users/me ─────>│── GET /users/me ─────────>│                          │
   │    (with cookie)          │    (with cookie)          │── Validate JWT ──────────│
   │                          │                          │── Return user ───────────>│
   │                          │<─── User data ───────────│                          │
   │<─── User data ───────────│                          │                          │
```

### Key Implementation Details

1. **`passReqToCallback: true`** - Allows access to tokens in verify callback
2. **`accessType: "offline"`** - Required to receive refresh tokens
3. **`prompt: "consent"`** - Forces consent screen (ensures refresh token)
4. **Token Preservation** - Existing refresh tokens are preserved if Google doesn't provide a new one
5. **Error Handling** - Redirects to login page with error query param on failure
6. **Nginx Proxy** - Routes `/api/*` to backend, rewrites to remove `/api` prefix
7. **Environment Variables:**
   - `APP_API_URL` - Full backend URL (e.g., `http://localhost:5000/api` via proxy, or `/api` if same origin)
   - `APP_BASE_URL` - Frontend URL (e.g., `http://localhost:5000`)
   - `GOOGLE_CALLBACK_URL` - Full callback URL for Google (e.g., `http://localhost:5000/api/auth/google/redirect`)

### Summary

- **We set the cookie** because the server must send it first
- **`cookie-parser`** is needed to read cookies from incoming requests
- **Cookies are secure** - HTTP-only prevents JavaScript access, reducing XSS risk
- **Google tokens are stored** in the database for API calls
- **Our JWT is separate** and used for app authentication
- **Passport handles** the OAuth code exchange automatically
- **Nginx proxy** routes requests: `/api/*` → backend, everything else → frontend
- **Environment variables** should be configured for your deployment:
  - `APP_API_URL=http://localhost:5000/api` (or `/api` if same origin)
  - `APP_BASE_URL=http://localhost:5000`
  - `GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect`

The browser handles storage and sending, but the server must set and read cookies explicitly. Google tokens are captured during OAuth and stored for later use with Google APIs.