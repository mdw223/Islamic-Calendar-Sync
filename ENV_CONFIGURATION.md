# Environment Variable Configuration Guide

## Overview

This project uses Docker Compose with an Nginx reverse proxy. Understanding the architecture is crucial for configuring environment variables correctly.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Host Machine                         │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                │
│  │   Frontend   │    │    Backend    │                │
│  │  (Vite)      │    │  (Express)    │                │
│  │  Port 80     │    │  Port 3000    │                │
│  │  (container) │    │  (container)  │                │
│  └──────┬───────┘    └──────┬───────┘                │
│         │                    │                          │
│         └──────────┬──────────┘                          │
│                   │                                      │
│            ┌──────▼──────┐                             │
│            │ Nginx Proxy │                             │
│            │  Port 80    │                             │
│            │ (container) │                             │
│            └──────┬──────┘                             │
│                   │                                      │
│            ┌──────▼──────┐                             │
│            │   Host      │                             │
│            │ Port 5000   │                             │
│            └─────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

**Nginx Routing:**

- `/api/*` → Backend (rewrites to remove `/api` prefix)
- `/*` → Frontend

## Environment Variables

### Frontend (React/Vite)

**Location:** `.env` file in `app/` directory or root

**IMPORTANT:** Vite requires environment variables to be prefixed with `VITE_` to be exposed to the browser!

```bash
# Backend API URL
# Option 1: Full URL (recommended for production)
VITE_APP_API_URL=http://localhost:5000/api

# Option 2: Relative path (works if frontend and backend are same origin)
VITE_APP_API_URL=/api
```

**How it works:**

- `HTTPClient.baseURL` uses `import.meta.env.VITE_APP_API_URL` (Vite's way of accessing env vars)
- When frontend calls `APIClient.getCurrentUser()`, it makes: `VITE_APP_API_URL + "/users/me"`
- Example: `http://localhost:5000/api/users/me` → Nginx → Backend receives `/users/me`

**Why `VITE_` prefix?**

- Vite only exposes environment variables prefixed with `VITE_` to the client-side code for security
- Variables without the prefix are not available in the browser
- Use `import.meta.env.VITE_APP_API_URL` instead of `process.env.APP_API_URL` in browser code

### Backend (Express/Node.js)

**Location:** `.env` file in root directory

```bash
# Frontend base URL (where OAuth redirects go)
APP_BASE_URL=http://localhost:5000

# Google OAuth Callback URL (full URL from Google's perspective)
# This is what Google will redirect to after authentication
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# JWT Secret
JWT_SECRET=your-secret-key

# Database Configuration
DB_HOST=database  # Docker service name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_DATABASE=ics_development
DB_PORT=5432

# API Port (internal, not exposed)
API_PORT=3000

# Node Environment
NODE_ENV=development
```

**Important Notes:**

1. **`GOOGLE_CALLBACK_URL`**:
   - Must match exactly what you configure in Google Cloud Console
   - From Google's perspective: `http://localhost:5000/api/auth/google/redirect`
   - Backend receives: `/auth/google/redirect` (after nginx rewrite)
   - The code uses `process.env.GOOGLE_CALLBACK_URL || "/auth/google/redirect"` as fallback

2. **`APP_BASE_URL`**:
   - Used for redirecting users after OAuth completes
   - Should be the frontend URL: `http://localhost:5000`
   - Default fallback: `http://localhost:5000` (updated from `localhost:5173`)

## Port Reference

| Service           | Container Port | Host Port | Access URL              |
| ----------------- | -------------- | --------- | ----------------------- |
| Frontend (Vite)   | 80             | -         | Via Nginx               |
| Backend (Express) | 3000           | -         | Via Nginx               |
| Nginx Proxy       | 80             | 5000      | `http://localhost:5000` |
| Database          | 5432           | 5432      | `localhost:5432`        |

## Configuration Examples

### Development (Docker Compose)

**Root `.env` file:**

```bash
# Backend environment variables
APP_BASE_URL=http://localhost:5000
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
API_PORT=3000

# Database
DB_HOST=database
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=ics_development
DB_PORT=5432
```

**`app/.env` file (or root `.env`):**

```bash
# Frontend environment variables
# Vite REQUIRES VITE_ prefix for client-side env variables
VITE_APP_API_URL=http://localhost:5000/api
# or relative:
VITE_APP_API_URL=/api
```

**Note:**

- Vite requires `VITE_` prefix for environment variables exposed to the browser
- Access them via `import.meta.env.VITE_APP_API_URL` (not `process.env`)
- `HttpClient.js` has been updated to use `import.meta.env.VITE_APP_API_URL`

### Production

```bash
APP_BASE_URL=https://yourdomain.com
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/redirect
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

## Google Cloud Console Configuration

**Authorized Redirect URIs:**

- Development: `http://localhost:5000/api/auth/google/redirect`
- Production: `https://yourdomain.com/api/auth/google/redirect`

**Authorized JavaScript Origins:**

- Development: `http://localhost:5000`
- Production: `https://yourdomain.com`

## Common Issues

### Issue 1: `APP_API_URL='/api/'` (Relative Path)

**Problem:** Relative paths work, but you need to ensure:

- Frontend and backend are on the same origin (same protocol, domain, port)
- With nginx proxy, this works because both are served from `localhost:5000`
- **CRITICAL:** Must use `VITE_` prefix: `VITE_APP_API_URL` not `APP_API_URL`

**Solution:**

- Use relative path: `VITE_APP_API_URL=/api`
- OR use full URL: `VITE_APP_API_URL=http://localhost:5000/api`
- Access in code: `import.meta.env.VITE_APP_API_URL` (not `process.env`)

### Issue 2: `process is not defined` Error

**Problem:** `Uncaught ReferenceError: process is not defined` in browser console

**Cause:**

- `process.env` is a Node.js feature, not available in the browser
- Vite uses `import.meta.env` for client-side environment variables
- Variables must be prefixed with `VITE_` to be exposed to the browser

**Solution:**

1. Update your `.env` file to use `VITE_` prefix:

   ```bash
   VITE_APP_API_URL=/api
   # or
   VITE_APP_API_URL=http://localhost:5000/api
   ```

2. Access in code using `import.meta.env`:

   ```javascript
   // ❌ Wrong (doesn't work in browser)
   const url = process.env.APP_API_URL;

   // ✅ Correct (Vite way)
   const url = import.meta.env.VITE_APP_API_URL;
   ```

3. `HttpClient.js` has been updated to use `import.meta.env.VITE_APP_API_URL`

**Note:** After updating `.env`, restart your Vite dev server or rebuild your Docker container.

### Issue 3: Hardcoded Ports

**Problem:** Code had hardcoded `localhost:5173` (Vite default)

**Solution:**

- Updated to use `process.env.APP_BASE_URL || "http://localhost:5000"` (backend only)
- Always use environment variables, never hardcode ports

### Issue 4: OAuth Callback URL Mismatch

**Problem:** Google redirects fail because callback URL doesn't match

**Solution:**

- Set `GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect`
- Ensure this matches exactly in Google Cloud Console
- Backend code uses this or falls back to `/auth/google/redirect`

## Summary

- **`VITE_APP_API_URL`**: Backend API URL (full URL or relative path) - **MUST have VITE\_ prefix for frontend**
- **`APP_BASE_URL`**: Frontend URL (where OAuth redirects go) - Backend only, no VITE\_ prefix needed
- **`GOOGLE_CALLBACK_URL`**: Full callback URL for Google OAuth - Backend only
- **Ports**: Frontend/Backend accessed via Nginx on port 5000
- **Always use environment variables**, never hardcode URLs or ports
- **Frontend**: Use `import.meta.env.VITE_*` (not `process.env`)
- **Backend**: Use `process.env.*` (Node.js)
