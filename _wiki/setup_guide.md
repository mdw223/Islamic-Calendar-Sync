# Setup Guide

## Prerequisites

Download and install the following:

- **PostgreSQL**: [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
- **Docker**: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
- **pgAdmin**: [https://www.pgadmin.org/](https://www.pgadmin.org/) is optional, a free, official PostgreSQL GUI tool for PostgreSQL database in Docker

## Installation

### API Setup

Navigate to the API directory and initialize the project:

```bash
cd api
npm init -y
```

This initializes a new Node.js project and creates a `package.json` file with default settings. The `-y` flag accepts all prompts automatically.

Install the required dependencies:

```bash
npm install express@^4.18.2 cors@^2.8.5 dotenv@^16.3.1 pg@^8.11.3 passport passport-google-oidc express-session cookie-parser
```

**Dependencies explained:**

- `express` - Web framework for Node.js that handles HTTP requests, routes, and middleware
- `cors` - Enables Cross-Origin Resource Sharing, allowing the frontend to call backend APIs
- `dotenv` - Loads environment variables from `.env` files into the application
- `pg` - PostgreSQL client for Node.js to connect to the database

Install development dependencies:

```bash
npm install --save-dev tsx@^4.6.2 jest@^29.6.4
```

Install for logging:

Uses [winston logging](https://github.com/winstonjs/winston)

```bash
npm install winston winston-transport
```

### App Setup (React/Vite)

Navigate to the app directory and create a new Vite project:

```bash
cd ../app
npm create vite@latest . -- --template react
```

This creates a Vite project using the React template.

Install dependencies:

```bash
npm install
npm install react-dom
npm install react-router
```

The second command explicitly installs React DOM for rendering React components.

Installs additional dependencies:

[Link to Icons Library](https://lucide.dev/)

```bash
npm install lucide-react @mui/material @emotion/react @emotion/styled
npm install @fontsource/roboto
npm install eslint-plugin-import --save-dev
```

### Database Setup

In pgAdmin, register a new server with the following details:

- **Name**: any name you prefer
- **Host name**: localhost
- **Port**: 5432
- **Maintenance database**: ics_development
- **Username**: postgres_user
- **Password**: your PostgreSQL password in `.env` file

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
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=ics_development
DB_PORT=5432

# API Port (internal, not exposed)
API_PORT=3000

# Node Environment
NODE_ENV=development

# Logging
DB_LOG_QUERIES=true
LOG_LEVEL=info

# Authentication
SESSION_SECRET=change-me-in-production
JWT_SECRET=change-me-in-production
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
