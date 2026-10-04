# Islamic Calendar Sync

A web app for staying in sync with the Islamic calendar. Generate Hijri events for any Gregorian year, choose which days matter to you, and either download a one-time `.ics` file or subscribe to a live feed that updates Google Calendar, Apple Calendar, Outlook, and other calendar apps.

Popular calendars can add a few Islamic holidays, but they are often incomplete, hard to customize, and silent about *why* a day matters. This project generates events from a catalogue of Islamic definitions, lets you show, hide, and color them, and is built so each event can carry a meaningful description — significance, practice, and related supplications — not just a label.

It started as a CSC 490 independent study. The write-up is in [docs/report/FINAL_REPORT.md](docs/report/FINAL_REPORT.md).

## Features

- Generate Islamic events (Ramadan, Eid, Hajj, White Days, and more) from a static definition catalogue
- Show, hide, and color event types per user
- Create custom events with rich-text descriptions
- Export a static `.ics` file or a live subscription URL with per-feed definition filters
- Sign in with Google OAuth or a magic-link email
- Works as a guest, including offline, then syncs to the server after login
- Installable PWA with IndexedDB fallback when the API is unreachable

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, MUI, Dexie, Workbox PWA |
| Backend | Express, Passport (JWT, Google OIDC, magic link), Winston |
| Data | PostgreSQL, Redis |
| Local / prod | Docker Compose, Nginx reverse proxy |

In development, Nginx on [http://localhost:5000](http://localhost:5000) serves the React app and proxies `/api/*` to Express. Production splits that: the frontend on GitHub Pages, the API on a VPS.

## Quick start

Docker is the usual local path. For Node-only setup, environment variables, Google OAuth, and database notes, use the [setup guide](docs/getting-started/setup.md).

```bash
git clone https://github.com/mdw223/Islamic-Calendar-Sync.git
cd Islamic-Calendar-Sync
cp .env.example .env
# fill in secrets; see docs/getting-started/setup.md
docker compose up -d --build
```

Then open [http://localhost:5000](http://localhost:5000). Health checks:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/db
```

Day-to-day Compose commands, migrations, and debugging are in the [development guide](docs/getting-started/development.md). Deploying the API to a VPS and the app to GitHub Pages is in the [deployment guide](docs/getting-started/deployment.md).

## Documentation

Start at [docs/README.md](docs/README.md). The same index, grouped:

### Getting started

- [Setup](docs/getting-started/setup.md) — local API and app, env vars, Google Cloud Console
- [Development](docs/getting-started/development.md) — Docker workflows, migrations, debugging
- [Deployment](docs/getting-started/deployment.md) — Contabo VPS, GitHub Pages, domain, CI

### Architecture

- [Entities](docs/architecture/entities.md) — users, events, preferences, subscriptions
- [API](docs/architecture/api.md) — endpoints, auth, status codes
- [Islamic events](docs/architecture/islamic-events.md) — definitions, Hijri conversion, generation
- [Wireframes](docs/architecture/wireframes.md) — UI sketches

### Auth

- [JWT](docs/auth/jwt.md) — cookie and bearer auth
- [Google OAuth](docs/auth/google-oauth.md) — Google login to app JWT
- [Subscription tokens](docs/auth/subscription-tokens.md) — ICS feed credentials

### Features

- [Offline and PWA](docs/features/offline-pwa.md) — IndexedDB fallback and shell caching
- [Logging](docs/features/logging.md) — Winston and Postgres transport
- [Subscription testing](docs/features/subscription-testing.md) — validating live ICS feeds

### Planning and report

- [Project timeline](docs/planning/PROJECT_TIMELINE.md) — roadmap and board audit
- [Final report](docs/report/FINAL_REPORT.md) — CSC 490 write-up

## Project layout

```text
api/                 Express API
app/                 React / Vite frontend
proxy/               Nginx (dev full-stack, prod API-only)
Sql.Migrations/      Schema init and incremental migrations
docs/                Guides referenced above
compose.yml          Local full stack
compose.prod.yml     Production API stack (no frontend container)
```

## License

No license file yet. Treat the repo as source-available unless a license is added.
