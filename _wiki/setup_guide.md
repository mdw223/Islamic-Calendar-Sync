# Setup Guide

This guide helps you get the Islamic Calendar Sync API and React app running locally. It assumes you have the repository (clone or download); for prerequisites and first-time setup, follow the sections in order.

---

## Quick start

1. **Prerequisites** — Install [Node.js](https://nodejs.org/) (LTS), [PostgreSQL](https://www.postgresql.org/download/), and optionally [Docker](https://www.docker.com/products/docker-desktop/) and [pgAdmin](https://www.pgadmin.org/).
2. **Clone the repo** (or unpack the source):
   ```bash
   git clone <repository-url>
   cd IslamicCalendarSync
   ```
3. **Install dependencies**
   - API:
     ```bash
     cd api
     npm install
     cd ..
     ```
   - App:
     ```bash
     cd app
     npm install
     cd ..
     ```
4. **Configure environment** — Copy or create `.env` in the project root (or locations below). Set at least: `POSTGRES_*`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `APP_BASE_URL`. See [Environment variables](#environment-variables).
5. **Database** — Create the database (e.g. `ics_development`) and run any migrations or seed scripts the project provides. Use pgAdmin or `psql` to connect (default port 5432).
6. **Run**
   - Start the API: `cd api && npm start` (listens on `API_PORT`, default 3000).
   - Start the app: `cd app && npm run dev` (Vite dev server).
   - If you use Docker/nginx as in the repo, start those so the app is served and the API is proxied (e.g. `http://localhost:5000`).

---

## Prerequisites

Install the following (links are for download or official docs):

| Prerequisite   | Purpose                          | Download / doc |
|----------------|----------------------------------|----------------|
| **Node.js**    | Run API and build frontend       | [nodejs.org](https://nodejs.org/) (LTS) |
| **PostgreSQL** | Database for the API             | [PostgreSQL downloads](https://www.postgresql.org/download/) or [EnterpriseDB](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) |
| **Docker**     | Optional: run DB or full stack  | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **pgAdmin**    | Optional: GUI for PostgreSQL     | [pgAdmin](https://www.pgadmin.org/) |

Use a Node version that matches the project (e.g. Node 18+). Check with `node -v`.

---

## Installation

### Option A: Using this repository (recommended)

The repo already contains `api/package.json` and `app/package.json`. You only need to install dependencies.

**API**

```bash
cd api
npm install
```

**App**

```bash
cd app
npm install
```

No need to run `npm init -y` or `npm create vite`; the projects are already set up.

### Option B: Install packages from scratch (reference)

If you were creating the API or app from scratch, you would install the following. **When using the repo, `npm install` in `api/` and `app/` is enough** — the lists below match the current `package.json` files and are for reference only.

**API (Express) — production dependencies**

```bash
cd api
npm install cookie-parser express jsonwebtoken morgan passport passport-google-oidc passport-jwt pg winston winston-transport
```

**API — dev dependencies**

```bash
npm install --save-dev jest
```

**App (React/Vite) — production dependencies**

```bash
cd app
npm install @emotion/react @emotion/styled @fontsource/roboto @mui/material lucide-react react react-dom react-router
```

**App — dev dependencies** (usually already in `package.json`)

```bash
npm install --save-dev eslint eslint-plugin-import @vitejs/plugin-react vite @eslint/js globals
```

---

## Package reference (current)

Use this to verify your install or to understand what each part of the stack uses.

### API (`api/package.json`)

| Package               | Version (approx) | Purpose |
|-----------------------|------------------|--------|
| cookie-parser         | ^1.4.7           | Parse `Cookie` header |
| express               | ^4.22.1          | Web framework |
| jsonwebtoken          | ^9.0.2           | Sign and verify JWTs |
| morgan                | ^1.10.0          | HTTP request logging |
| passport              | ^0.7.0           | Authentication middleware |
| passport-google-oidc  | ^0.1.0           | Google OAuth2 strategy |
| passport-jwt           | ^4.0.1           | JWT strategy for API auth |
| pg                    | ^8.17.1          | PostgreSQL client |
| winston               | ^3.19.0          | Logging |
| winston-transport     | ^4.9.0           | Winston transport |
| **Dev:** jest         | ^29.7.0          | Tests |

The API uses JWT for authentication. `express-session` is still used in the Google OAuth redirect handshake to persist OIDC state; it is not the application's login session mechanism.

### App (`app/package.json`)

| Package          | Version (approx) | Purpose |
|------------------|------------------|--------|
| @emotion/react   | ^11.14.0         | CSS-in-JS (MUI) |
| @emotion/styled  | ^11.14.1         | Styled components (MUI) |
| @fontsource/roboto | ^5.2.9         | Roboto font for MUI |
| @mui/material    | ^7.3.7           | UI components |
| lucide-react     | ^0.563.0         | Icons |
| react            | ^19.2.0          | UI library |
| react-dom        | ^19.2.3          | React DOM renderer |
| react-router     | ^7.13.0          | Routing |
| **Dev:** vite, eslint, etc. | — | Build and lint |

---

## Database setup

1. Install and start PostgreSQL (locally or in Docker).
2. Create a database (e.g. `ics_development`) and a user with access.
3. In pgAdmin (or another client), register the server:
   - **Host:** `localhost` (or Docker host)
   - **Port:** 5432
   - **Maintenance database:** `ics_development` (or `postgres`)
   - **Username / password:** match your `.env` (e.g. `POSTGRES_USER`, `POSTGRES_PASSWORD`).

Run any migrations or seed scripts the project provides so the schema exists before starting the API.

If your database already exists and you are upgrading to the subscription-definition selection feature, run:

```bash
psql -h localhost -U <db_user> -d <db_name> -f Sql.Migrations/001_subscription_definition_selection.sql
```

---

## Environment variables

### Generating secrets

**JWT_SECRET** (and any other secret keys) should be long and random:

- **Node:**  
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **OpenSSL:**  
  `openssl rand -hex 32`

Copy the output into `.env` as `JWT_SECRET=<value>`. Do not commit `.env` or real secrets to the repo. In production, use environment variables or a secrets manager instead of a `.env` file.

### Backend (Express) — root `.env` or `api/.env`

```bash
# Frontend base URL (OAuth redirect target)
APP_BASE_URL=http://localhost:5000

# Google OAuth
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# JWT (required for auth)
JWT_SECRET=your-secret-key-change-in-production

# Database
DB_HOST=localhost
POSTGRES_USER=postgres_user
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=ics_development
DB_PORT=5432

# API
API_PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info
DB_LOG_QUERIES=true
```

**Notes**

- **JWT_SECRET** — Used to sign and verify JWTs. Use a long, random value in production. The code also accepts `SESSION_SECRET` as a fallback name.
- **GOOGLE_CALLBACK_URL** — Must match the value configured in Google Cloud Console (e.g. `http://localhost:5000/api/auth/google/redirect`).
- **DB_HOST** — Use `localhost` when PostgreSQL runs on the host; use the service name (e.g. `database`) when the API runs in Docker and the DB is another container.

---

## Port reference

| Service            | Port (typical) | Notes                    |
|--------------------|----------------|--------------------------|
| API (Express)      | 3000           | Internal; set via `API_PORT` |
| App (Vite dev)     | 5173           | When running `npm run dev` in `app/` |
| Nginx proxy (if used) | 5000        | e.g. `http://localhost:5000` |
| PostgreSQL         | 5432           | Default DB port          |

---

## Configuration examples

### Production (split-hosting example)

```bash
APP_BASE_URL=https://www.yourdomain.com
API_PUBLIC_URL=https://api.yourdomain.com
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/redirect
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
JWT_SECRET=your-production-jwt-secret
NODE_ENV=production
```

> **Split hosting note:** `API_PUBLIC_URL` is required when frontend and API are on different domains (e.g., GitHub Pages + VPS). Magic links and OAuth callbacks use this to generate URLs that point to the API server, while `APP_BASE_URL` is used for post-login redirects to the frontend.

---

## Google Cloud Console

For Google OAuth login you need an OAuth 2.0 application in [Google Cloud Console](https://console.cloud.google.com/). Follow the steps below to create one and wire it to the application.

### 1. Create or select a project

Go to [console.cloud.google.com](https://console.cloud.google.com/), click the project picker at the top, and either select an existing project or create a new one.

### 2. Enable required APIs

Navigate to **APIs & Services > Library** and enable the following APIs:

| API | Required for |
|-----|-------------|
| **Google People API** | Profile and email access during sign-in |
| **Google Calendar API** | Optional; only needed if you add Google Calendar API features |

### 3. Configure the OAuth consent screen

1. Navigate to **APIs & Services > OAuth consent screen**.
2. Choose **External** (allows any Google account) or **Internal** (Google Workspace users only).
3. Fill in: app name, user support email, and developer contact email.
4. Under **Scopes**, add:
   - `openid`
   - `profile`
   - `email`
   - `https://www.googleapis.com/auth/calendar`
5. While the app is in **Testing** mode, add any Google accounts that need to log in as **Test users**. Only listed users can authenticate until the app is published.

### 4. Create OAuth 2.0 credentials

1. Navigate to **APIs & Services > Credentials**.
2. Click **+ Create Credentials > OAuth 2.0 Client ID**.
3. Set **Application type** to **Web application**.
4. Under **Authorized JavaScript origins**, add:
   - Dev: `http://localhost:5000`
   - Prod: `https://www.yourdomain.com`
5. Under **Authorized redirect URIs**, add:
   - Dev: `http://localhost:5000/api/auth/google/redirect`
   - Prod: `https://api.yourdomain.com/api/auth/google/redirect`
6. Click **Create**. Copy the **Client ID** and **Client Secret** that appear.

> **Important:** The redirect URI registered in Google Cloud Console must match `GOOGLE_CALLBACK_URL` in your `.env` **exactly** — including scheme, host, port, and path. Any mismatch produces `Error 400: redirect_uri_mismatch`.

### 5. Set environment variables

Add the credentials to your `.env`:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect
APP_BASE_URL=http://localhost:5000
```

For production, update both values to your domain (see [Configuration examples — Production](#production) above and the Production Deployment section in the main project report).

### How the OAuth flow works

The API uses `passport-google-oidc` with `accessType: "offline"` and `prompt: "consent"` for OAuth login flow robustness.

After the callback, the server does **not** use Google's token to authenticate API requests. It issues its own application JWT, stores it in a secure httpOnly cookie (`token` in production), and redirects to `APP_BASE_URL`.

The application JWT (signed with `JWT_SECRET`) is what `passport-jwt` validates on protected routes.

See [google_oauth_strategy_implementation.md](google_oauth_strategy_implementation.md) for the complete technical breakdown of all backend components, the end-to-end flow, and the token summary table.

---

## Common issues

### OAuth callback URL mismatch

- Set `GOOGLE_CALLBACK_URL` to the **full** URL (e.g. `http://localhost:5000/api/auth/google/redirect`).
- Ensure it matches **exactly** in Google Cloud Console (Authorized redirect URIs).

### Database connection refused

- If the API runs on the host: use `DB_HOST=localhost`.
- If the API runs in Docker and the DB is in another container: use the DB service name for `DB_HOST` and ensure the DB port is reachable.

### Relative API URL (`/api`)

- Relative paths work when frontend and backend are same origin (e.g. both behind nginx at `localhost:5000`).
