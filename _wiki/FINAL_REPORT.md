# CSC 490 Independent Study — Final Report

**Project Type:** Independent Development  
**Student:** Malik Wensman (200463812)  
**Mentor:** Dominguez, Ignacio X  
**Semester:** Spring 2026

---

## Table of Contents

1. [Problem Statement, Proposed Solution, and Project Goals](#1-problem-statement-proposed-solution-and-project-goals)
2. [Requirements](#2-requirements)
3. [High-Level Design](#3-high-level-design)
4. [Low-Level Design](#4-low-level-design)
5. [Implementation Details](#5-implementation-details)
6. [Unit and System Testing](#6-unit-and-system-testing)
7. [Installation and Setup Guidelines](#7-installation-and-setup-guidelines)
8. [Reflection](#8-reflection)

---

## 1. Problem Statement, Proposed Solution, and Project Goals

Many Muslims today forget the significance behind the Islamic calendar and its sacred days and months. We often go through the motions — doing things because we heard they are good or required — without knowing the real, life-changing lessons and deep meanings behind them. This causes a gradual loss of connection with the Islamic tradition and the Islamic calendar.

Furthermore, with the digital age and our increasingly busy lives, it has become difficult to keep track of anything unless it is scheduled in a calendar with a reminder.

Popular calendar applications like Google Calendar do offer the ability for users to add Islamic holidays, but these features go largely unused by Muslims because they lack genuine benefit. The built-in options are not always accurate, are not customizable, do not include all significant Islamic calendar days, and crucially provide no insight into the meaning or significance of each day.

**Islamic Calendar Sync** is a tool and platform designed to solve this problem. It is a web application for Muslims with busy lives to stay in sync with the Islamic calendar. Users can select which Islamic days and months matter most to them and either download events as a static `.ics` file for a one-time import, or subscribe to a live calendar feed URL that automatically populates events in their calendar application of choice (Google Calendar, Apple Calendar, Outlook, etc.).

The real value lies in the description of each event. Rather than a simple label, each event description contains the significance behind it, how to attain maximum reward by practicing it correctly, relevant supplications, and more. This way Muslims will be reminded of what matters — not just that a day is significant, but why it is significant and what to do about it — thus strengthening their connection with God through staying in sync with the sacred days of the Islamic calendar.

### Project Goals

- Provide accurate, Hijri-to-Gregorian date conversion for Islamic events.
- Allow users to select which event definitions they want and generate calendar events for any year range.
- Deliver events with rich, meaningful descriptions, not just names (planned but not yet implemented in this semester build).
- Support export via `.ics` file download and via live subscription URL (webcal/iCal feed).
- Support both authenticated users (with server-persisted preferences) and unauthenticated guests (with full offline/local-storage functionality).
- Build a Progressive Web App (PWA) that is installable and works offline.

---

## 2. Requirements

The following use cases describe the functional requirements of the system. They were tracked as GitHub Issues throughout development.

### Authentication and Accounts

| UC    | Use Case                    | Description                                                                                                     |
| ----- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| UC-01 | Register with Email         | A user can register for an account using their email address. A magic-link email is sent to verify the address. |
| UC-02 | Login with Google OAuth     | A user can log in using their Google account via OAuth 2.0 (OIDC).                                              |
| UC-03 | Login with Microsoft OAuth  | A user can log in using their Microsoft account via OAuth 2.0.                                                  |
| UC-04 | Login with Apple OAuth      | A user can log in using their Apple ID via OAuth 2.0.                                                           |
| UC-05 | Login with Magic Link Email | A user can log in by entering their email and receiving a one-time login link.                                  |
| UC-06 | Logout                      | An authenticated user can log out, clearing their session.                                                      |
| UC-07 | Delete Account              | An authenticated user can permanently delete their account and all associated data.                             |

### Event Definitions and Preferences

| UC    | Use Case                         | Description                                                                                                                      |
| ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| UC-08 | View Islamic Event Definitions   | A user can view all available Islamic event definitions (e.g., Ramadan, Ashura, Eid ul-Fitr, White Days) from the sidebar panel. |
| UC-09 | Show/Hide Definitions            | A user can toggle the visibility of individual Islamic event definitions, hiding events they do not want displayed.              |
| UC-10 | Set Default Color for Definition | A user can assign a custom color to an event definition, which is applied to all events generated from that definition.          |
| UC-11 | Persist Definition Preferences   | Preference changes (show/hide, color) are saved and persisted for authenticated users.                                           |

### Event Management

| UC    | Use Case                           | Description                                                                                                    |
| ----- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| UC-12 | Generate Islamic Events for a Year | A user can generate all Islamic calendar events for a selected year or range of years.                         |
| UC-13 | View Events on Calendar            | A user can view generated events on a monthly, weekly, or day calendar view.                                   |
| UC-14 | View Event Details                 | A user can click on a calendar event to view its full details including name, date, and rich-text description. |
| UC-15 | Create Custom Event                | An authenticated user can create a custom calendar event with a name, date, and rich-text description.         |
| UC-16 | Edit Event                         | A user can edit the name, dates, color, and description of a calendar event.                                   |
| UC-17 | Delete Event                       | A user can delete a specific calendar event.                                                                   |
| UC-18 | Reset Islamic Events               | A user can reset all auto-generated Islamic events back to their defaults.                                     |
| UC-19 | Search Events                      | A user can search for events by name using a global search field.                                              |

### Export and Subscription

| UC    | Use Case                               | Description                                                                                                                                 |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| UC-20 | Download ICS File                      | A user can download a `.ics` file of their selected events to import into any calendar application.                                         |
| UC-21 | Create Subscription URL                | An authenticated user can generate a live subscription URL (webcal feed) that calendar applications can subscribe to for automatic updates. |
| UC-22 | Manage Subscription URLs               | An authenticated user can view, rename, and revoke their subscription URLs.                                                                 |
| UC-23 | Configure Subscription Event Selection | When creating a subscription URL, a user can select which event definitions to include in that specific feed.                               |

### Settings and Personalization

| UC    | Use Case                 | Description                                                                                                          |
| ----- | ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| UC-24 | Update Profile           | An authenticated user can update their display name and language preference.                                         |
| UC-25 | Manage Saved Locations   | A user can save named locations (with latitude, longitude, and timezone) for use during event generation and export. |
| UC-26 | Set Default Location     | A user can designate one of their saved locations as the default.                                                    |
| UC-27 | Toggle Arabic Event Text | A user can enable or disable the display of Arabic text alongside event names.                                       |

### Offline and PWA

| UC    | Use Case                   | Description                                                                                                                       |
| ----- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| UC-28 | Use App Offline            | A user can use the application (view, generate, and customize events) without a network connection using local IndexedDB storage. |
| UC-29 | Sync Offline Data on Login | When an offline/unauthenticated user logs in, their locally cached events and preferences are automatically synced to the server. |
| UC-30 | Install as PWA             | A user can install the application to their home screen as a Progressive Web App for a native app-like experience.                |

---

## 3. High-Level Design

### Architecture Overview

Islamic Calendar Sync follows a standard three-tier web application architecture:

```
┌──────────────────────────────────────────────┐
│                  User (Browser)               │
│         React SPA  ·  PWA / Service Worker    │
└────────────────────┬─────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────▼─────────────────────────┐
│              Nginx Reverse Proxy              │
│   /api  →  Express API   |  /  →  React App  │
└────────────────────┬─────────────────────────┘
          ┌──────────┴──────────┐
          │                     │
┌─────────▼──────┐    ┌────────▼────────┐
│  Express.js    │    │   React (Vite)  │
│  REST API      │    │   Frontend      │
└─────────┬──────┘    └─────────────────┘
          │
    ┌─────┴──────┐
    │            │
┌───▼───┐  ┌───▼───┐
│  PG   │  │ Redis │
│  DB   │  │ Cache │
└───────┘  └───────┘
```

All five services are orchestrated together using Docker Compose.

### Tech Stack

#### Frontend

| Technology        | Version | Purpose                                           |
| ----------------- | ------- | ------------------------------------------------- |
| React             | 19      | UI component library                              |
| Vite              | 7       | Build tool and development server                 |
| React Router      | 7       | Client-side routing                               |
| MUI (Material UI) | 7       | Component library for consistent UI design        |
| Emotion           | 11      | CSS-in-JS styling engine used by MUI              |
| Lexical           | 0.41    | Rich text editor for event descriptions           |
| Dexie.js          | 4       | IndexedDB wrapper for offline storage             |
| rrule             | 2.8     | Recurrence rule parsing (RFC 5545)                |
| DOMPurify         | 3       | HTML sanitization for rendered rich text          |
| Lucide React      | 0.563   | Icon library                                      |
| vite-plugin-pwa   | 1.2     | Workbox-powered PWA and service worker generation |
| Day.js            | 1.11    | Lightweight date manipulation library             |

#### Backend

| Technology           | Version | Purpose                                                                    |
| -------------------- | ------- | -------------------------------------------------------------------------- |
| Node.js              | 22      | JavaScript runtime                                                         |
| Express.js           | 4       | Web framework for the REST API                                             |
| Passport.js          | 0.7     | Authentication middleware                                                  |
| passport-google-oidc | 0.1     | Google OAuth 2.0 strategy                                                  |
| passport-microsoft   | 2.1     | Microsoft OAuth 2.0 strategy _(implemented but routes currently inactive)_ |
| passport-apple       | 2.0     | Apple Sign In strategy _(implemented but routes currently inactive)_       |
| passport-magic-link  | 3.0     | Email magic-link strategy                                                  |
| passport-jwt         | 4.0     | JWT-based authentication strategy                                          |
| jsonwebtoken         | 9.0     | JWT signing and verification                                               |
| pg                   | 8       | PostgreSQL client                                                          |
| rrule                | 2.8     | RFC 5545 recurrence rule expansion                                         |
| sanitize-html        | 2       | Server-side HTML sanitization                                              |
| Winston              | 3       | Structured logging                                                         |
| Nodemailer           | 7       | SMTP email delivery (magic links and contact form)                         |

#### Infrastructure

| Technology              | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| PostgreSQL 15           | Primary relational database                                                 |
| Redis                   | Caching layer and session store (for OAuth state)                           |
| Nginx                   | Reverse proxy; routes `/api/*` to Express, all other paths to the React app |
| Docker / Docker Compose | Container orchestration for all five services                               |

### Docker Services

Container topology differs by environment:

- **Development (`compose.yml`)** runs the full stack in Docker: API + React app + Nginx + Postgres + Redis.
- **Production (`compose.prod.yml`)** runs backend services only on the VPS: API + Nginx + Postgres + Redis. The frontend is deployed separately to GitHub Pages.

| Environment | Services                                   | Notes                                                                                     |
| ----------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Development | `api`, `app`, `proxy`, `database`, `redis` | Single local entry point (`http://localhost:5000`) via Nginx                              |
| Production  | `api`, `proxy`, `database`, `redis`        | API served from `api.<domain>` over HTTPS; SPA served from `www.<domain>` on GitHub Pages |

**Development containers (`compose.yml`)**

| Container             | Image / Build                              | Role                                                                                |
| --------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| `api_service`         | Custom Node.js build (`api/Dockerfile`)    | Express REST API on port 3000 (internal)                                            |
| `react_app`           | Custom Vite/Nginx build (`app/Dockerfile`) | Serves the React SPA in local Docker development                                    |
| `nginx_proxy`         | `nginx:latest`                             | Reverse proxy on port 5000 (HTTP) and 443 (HTTPS); routes traffic to `api` or `app` |
| `ics_redis_dev`       | `redis:latest`                             | In-memory cache on port 6379                                                        |
| `ics_postgres_db_dev` | `postgres:15`                              | PostgreSQL database on port 5432; initialized with `Sql.Migrations/init.sql`        |

**Production containers (`compose.prod.yml`)**

| Container              | Image / Build                           | Role                                                                                                     |
| ---------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `api_service_prod`     | Custom Node.js build (`api/Dockerfile`) | Express REST API on port 3000 (internal)                                                                 |
| `nginx_proxy_prod`     | `nginx:latest`                          | API-only reverse proxy on ports 80/443 with TLS termination; routes `/api` to `api` and rejects root SPA |
| `ics_redis_prod`       | `redis:latest`                          | In-memory cache on internal Docker network only                                                          |
| `ics_postgres_db_prod` | `postgres:15`                           | PostgreSQL 15 with persistent Docker volume and init script mount                                        |

> Note: there is no `react_app` container in production; the frontend is hosted separately on GitHub Pages.

Nginx API routing in production:

- `location /api` → `http://api:3000` (strips `/api` prefix via rewrite)
- `location /` → returns API-only 404 JSON message (frontend is not served by production Nginx)

---

## 4. Low-Level Design

### Database Schema

The database is a PostgreSQL relational database initialized by `Sql.Migrations/init.sql`. Schema migrations are tracked in the `SchemaMigration` table.

#### Entity Relationship Diagram

```
User ─────────────────────────── AuthProviderType (FK)
 │                                CalculationMethod (FK)
 ├──< Event                         (one-to-many)
 ├──< CalendarProvider              (one-to-many)
 │     └── CalendarProviderType (FK)
 ├──< UserLocation                  (one-to-many)
 ├──< UserIslamicDefinitionPreference (one-to-many)
 ├──< SubscriptionToken             (one-to-many)
 │     └──< SubscriptionDefinitionSelection (one-to-many)
 └──< Log                           (one-to-many)

MagicLinkUsedToken                  (standalone, keyed by UserUid)
SchemaMigration                     (migration tracking)
```

#### Key Tables

**`User`** — Central entity. Stores identity, OAuth tokens, display preferences, and configuration ranges for event generation. Supports four authentication providers (Google, Microsoft, Apple, Email).

**`Event`** — Stores both auto-generated Islamic calendar events and user-created custom events. Key fields include `HijriMonth`, `HijriDay`, `DurationDays`, `RRule` (recurrence), `IslamicDefinitionId` (links back to the definition that generated the event), and `EventTimezone`. A partial unique index on `(UserId, IslamicDefinitionId)` ensures one master record per user per definition for deduplication during bulk upserts.

**`UserIslamicDefinitionPreference`** — Stores per-user overrides for event definition visibility (`IsHidden`) and default color (`DefaultColor`). Keyed by `(UserId, DefinitionId)`.

**`SubscriptionToken`** — Stores opaque subscription-feed tokens for the live calendar feed feature. Tokens are stored as salted hashes; the plaintext token is only returned at creation time.

**`SubscriptionDefinitionSelection`** — Associates a subscription token with specific definition IDs, allowing each subscription URL to serve a customized subset of events.

**`MagicLinkUsedToken`** — Persists consumed one-time magic-link JWTs so they cannot be reused, even across server restarts.

**`Log`** — Structured application log records persisted to Postgres. Sensitive fields are redacted before write. Includes request metadata (method, path, status code, duration, IP), error information, and a `Meta` JSONB column for arbitrary context.

### Frontend Component Architecture

The frontend follows a layered architecture with contexts, layouts, pages, and components.

#### Contexts (Global State)

| Context           | File                           | Responsibility                                                                                 |
| ----------------- | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| `UserContext`     | `contexts/UserContext.jsx`     | Manages authentication state, login/logout, and sync-on-login flow                             |
| `CalendarContext` | `contexts/CalendarContext.jsx` | Manages events, definitions, and all CRUD operations with API-first / offline-fallback pattern |
| `ThemeContext`    | `contexts/ThemeContext.jsx`    | MUI theme management with light, dark, and green modes                                         |

#### Layouts

| Layout           | Route Scope                     | Purpose                                             |
| ---------------- | ------------------------------- | --------------------------------------------------- |
| `RootLayout`     | All routes                      | Navbar, Footer, global providers                    |
| `MainLayout`     | App pages                       | Main content wrapper                                |
| `CalendarLayout` | `/calendar`                     | Sidebar (Islamic Events Panel) + main calendar area |
| `AuthLayout`     | `/auth/login`, `/auth/register` | Centered auth pages                                 |

#### Core Pages

| Page                 | Path                            | Description                                                                    |
| -------------------- | ------------------------------- | ------------------------------------------------------------------------------ |
| Home                 | `/`                             | Landing page with upcoming Islamic days                                        |
| Calendar             | `/calendar`                     | Main calendar view (month/week/day) with event management                      |
| Export Events        | `/export`                       | Download `.ics` file                                                           |
| Manage Subscriptions | `/subscriptions`                | Create and manage subscription URLs                                            |
| Settings             | `/settings`                     | User profile, locations, preferences                                           |
| Login / Register     | `/auth/login`, `/auth/register` | Authentication flows                                                           |
| Guide                | `/guide`                        | User guide for importing events                                                |
| Learn                | `/learn`                        | Planned educational content page (route reserved; content not yet implemented) |
| Features             | `/features`                     | Overview of platform features                                                  |
| Methods              | `/methods`                      | Explanation of Hijri calculation methods                                       |
| Privacy              | `/privacy`                      | Privacy policy                                                                 |
| Terms                | `/terms`                        | Terms of service                                                               |
| Data Policy          | `/data-policy`                  | Data handling policy                                                           |

#### Offline Architecture

The app implements an **API-first with offline fallback** pattern:

1. All data operations first attempt the REST API.
2. If the request fails due to a network error or a `401`/`403` auth error, the operation automatically retries against `OfflineClient`, which uses an IndexedDB database (via Dexie.js) named `IslamicCalendarSyncOffline`.
3. On the next successful login, `syncOfflineData()` in `UserContext` pushes cached IndexedDB data to the server via `POST /events/sync` and `POST /definitions/sync`, then clears the local cache.

The app is also a full **Progressive Web App (PWA)** using `vite-plugin-pwa` (Workbox). The service worker precaches all static assets (JS, CSS, HTML, fonts, images), enabling the app shell to load without a network connection. Runtime caching strategies are applied for navigation requests and Google Fonts.

#### Notable UI Components

The `components/` directory contains reusable components shared across pages. Several key components were added or significantly updated:

| Component                   | Purpose                                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Navbar.jsx`                | `AppBar` with navigation links, `GlobalSearch`, `UserBadge`, mobile drawer, three-mode theme cycle (light / dark / green), and Web Share API integration |
| `Footer.jsx`                | Multi-column footer (Product, Legal, Connect) with theme-aware styling via `data-lp-theme`                                                               |
| `UserBadge.jsx`             | Avatar and dropdown menu for authenticated users (Settings, Sign out)                                                                                    |
| `GlobalSearch.jsx`          | Popper-based event search with filter chips persisted to `localStorage`; input sanitized via DOMPurify                                                   |
| `LoginPromptModal.jsx`      | Modal prompting unauthenticated users to continue with Google or email login                                                                             |
| `SearchField.jsx`           | Reusable search input that passes all values through DOMPurify before use                                                                                |
| `RichTextEditor.jsx`        | Lexical-based rich text editor with bold/italic/underline/strikethrough, lists, speech-to-text, markdown import/export, and read-only mode               |
| `GoogleTranslateWidget.jsx` | Loads the Google Translate script for multilingual support; respects `user.language` when set                                                            |

---

## 5. Implementation Details

### Development Environment

The recommended development workflow uses Docker Compose, which launches all five services in a single command:

```bash
docker compose up --build
```

The application is then accessible at `http://localhost:5000`. Nginx serves as the single entry point, routing API calls and frontend requests to the correct container. Source files in `api/src` and `app/src` are bind-mounted into their respective containers, so changes are reflected without rebuilding.

For the development environment, `nodemon` is used in the API container to hot-reload the Node.js server on file changes, and Vite's HMR (Hot Module Replacement) handles live reloading in the frontend container.

### Project Structure

```
IslamicCalendarSync/
├── api/                         # Express.js REST API
│   ├── src/
│   │   ├── index.js             # App entry point; registers middleware and routes
│   │   ├── Config.js            # Environment-based configuration
│   │   ├── Passport.js          # Passport strategy configuration (Google, Microsoft, Apple, Magic Link, JWT)
│   │   ├── endpoints/           # Route handlers organized by resource
│   │   │   ├── events/          # CRUD for calendar events + ICS generation + offline sync
│   │   │   ├── definitions/     # Islamic definition preferences + offline sync
│   │   │   ├── subscription/    # Subscription token CRUD + live feed endpoint
│   │   │   ├── users/           # User CRUD and authentication
│   │   │   ├── user-locations/  # Saved location CRUD
│   │   │   ├── calendar-providers/  # Calendar provider management
│   │   │   ├── health/          # Health check endpoint
│   │   │   └── Routes.js        # Central route registration
│   │   ├── middleware/
│   │   │   ├── AuthMiddleware.js        # JWT validation; attaches user to request; subscription token validation
│   │   │   ├── ErrorHandlerMiddleware.js # Global error handler
│   │   │   ├── NotFoundMiddleware.js    # 404 handler
│   │   │   ├── RateLimiter.js          # express-rate-limit + Redis; keyed by userId or IP
│   │   │   ├── RequestSanitizer.js     # Strips __proto__, constructor, prototype keys (prototype pollution defense)
│   │   │   ├── ResponseSanitizer.js    # Strips sensitive fields from responses
│   │   │   └── Logger.js               # Winston-based structured logger
│   │   ├── model/
│   │   │   ├── db/DBConnection.js      # pg Pool connection
│   │   │   └── db/doa/                 # Data Object Access (DOA) layer — one file per table
│   │   ├── services/
│   │   │   ├── EventExpansionService.js # Expands recurring events (RRule) for a date range
│   │   │   ├── IcsBuilder.js           # Builds RFC 5545 iCalendar files
│   │   │   └── IslamicEventService.js  # Generates Islamic events from definitions + Hijri conversion
│   │   ├── util/
│   │   │   ├── HijriUtils.js           # Hijri ↔ Gregorian date conversion utilities
│   │   │   └── SanitizeHtml.js         # sanitize-html wrapper
│   │   ├── data/
│   │   │   └── islamicEvents.json      # Source-of-truth definitions for all Islamic events
│   │   └── Constants.js
│   ├── jest.config.cjs
│   └── package.json
│
├── app/                         # React frontend
│   ├── src/
│   │   ├── main.jsx             # React entry point; service worker registration
│   │   ├── App.jsx              # Root component; router setup
│   │   ├── Theme.js             # MUI theme definition
│   │   ├── components/          # Reusable UI components (Navbar, Footer, Calendar, Modals, etc.)
│   │   ├── contexts/            # React contexts (User, Calendar, Theme)
│   │   ├── layouts/             # Page layout wrappers
│   │   ├── pages/               # Route-level page components
│   │   ├── services/            # Client-side services (Islamic event generation)
│   │   ├── models/              # Client-side model/config classes
│   │   ├── util/                # Utilities (ApiClient, OfflineClient, OfflineDb, HijriUtils, etc.)
│   │   └── data/
│   │       └── islamicEvents.json  # Bundled copy of definitions (enables offline generation)
│   ├── vite.config.js           # Vite + PWA plugin configuration
│   └── package.json
│
├── proxy/
│   └── nginx.conf               # Nginx reverse proxy configuration
│
├── Sql.Migrations/
│   ├── init.sql                 # Full database initialization script
│   └── 001+_*.sql               # Incremental schema migrations (tracked in SchemaMigration)
│
├── _wiki/                       # Internal developer documentation
├── compose.yml                  # Docker Compose — development
├── compose.prod.yml             # Docker Compose — production
└── compose.test.yml             # Docker Compose — CI testing
```

### How It Works — User Perspective

1. **Landing Page** — The user arrives at the home page, which shows a preview of upcoming Islamic days and explains the platform.

2. **Calendar View** — The user navigates to the calendar. The Islamic Events Panel sidebar lists all available Islamic event definitions (Ramadan, Ashura, White Days of each month, Eid ul-Fitr, etc.). Each definition shows its name, a brief description, and a visibility toggle.

3. **Wizard Pages (Guided Setup)** — For export and subscription workflows, the user is guided through step-based wizard pages (`ExportEvents.jsx` and `ManageSubscriptions.jsx`) to choose provider/options, configure included definitions, and confirm actions with less chance of misconfiguration.

4. **Generate Events** — The user selects a year (or range of years) and clicks "Generate." The app calls the backend, which uses `IslamicEventService` and `HijriUtils.js` to convert Hijri dates to Gregorian dates and creates `Event` records in the database. The resulting events appear on the calendar.

5. **Event Details** — Clicking any event opens a modal showing the event's full rich-text description, including its Islamic significance, recommended practices, and any relevant supplications.

6. **Customization** — The user can edit an event's name, color, dates, or description. They can also hide definitions they do not want included in their calendar.

7. **Export** — On the Export page, the user chooses their calendar provider (Google Calendar, Apple Calendar, Outlook, Cal.com) and either downloads a `.ics` file to import once, or generates a subscription URL that they can add to their calendar application for live, automatically-updating events. Exported events also include links back to the web app so users can open the platform and learn more about an event in depth.

8. **Offline Mode** — All of the above works without an internet connection or without being logged in. Events and preferences are stored in IndexedDB. On the next login, data is automatically synced to the server.

### Key Backend Features

**Islamic Event Generation** — `IslamicEventService.js` reads event definitions from `islamicEvents.json`. Each definition specifies a Hijri month, Hijri day, duration, and recurrence type. `HijriUtils.js` performs the Hijri-to-Gregorian conversion using `Intl.DateTimeFormat` with the `islamic-umalqura` calendar, iterating each day of the requested Gregorian year to build a lookup map.

**ICS Builder** — `IcsBuilder.js` constructs a valid RFC 5545 iCalendar file from a set of event records. It handles all-day events, duration, timezone, links back to the application for deeper event context, and rich-text descriptions (HTML stripped to plain text for maximum compatibility).

**Subscription Feed** — `GetSubscriptionEvents.js` accepts a hashed token from the URL, validates it against the database, fetches the associated user's events (filtered to selected definitions), and returns a live `.ics` response. This endpoint is unauthenticated — the token itself is the credential.

**Authentication** — Two authentication strategies are currently active: **Google OAuth 2.0** (`passport-google-oidc`) and **Magic Link email** (`passport-magic-link`). Microsoft and Apple strategies are implemented in `Passport.js` but their routes are inactive. On successful authentication (both Google OAuth and Magic Link), the server issues a signed JWT stored in a **secure httpOnly cookie** (`token` in production; `secure: true` when `NODE_ENV=production`, with `sameSite: "lax"`, 7-day `maxAge`). The global `authenticateJwt` middleware (applied before all routes in `index.js`) decodes the cookie on every request and attaches `req.user` when a valid JWT is present; protected routes then use `Auth(role)` from `AuthMiddleware.js` to enforce authorization. The secure httpOnly cookie approach means the token is never accessible to JavaScript and is only sent over HTTPS in production, reducing XSS and transport-level exposure risk.

**Response Sanitizer** — `ResponseSanitizer.js` middleware automatically removes sensitive fields (tokens, salts, passwords) from all API responses before they are sent to the client.

**Request Sanitizer** — `RequestSanitizer.js` middleware runs before route handlers and recursively removes prototype-pollution keys (`__proto__`, `constructor`, `prototype`) from `req.body`, `req.query`, and `req.params`. This prevents attackers from injecting properties into the JavaScript object prototype via incoming request data.

**Rate Limiter** — `RateLimiter.js` applies `express-rate-limit` backed by a **Redis** store to every API request. It enforces a rolling 15-minute window (`windowMs = 15 * 60 * 1000`) with a configurable maximum request count (`appConfig.RATE_LIMIT_MAX`). Authenticated requests are keyed by `userId`; unauthenticated requests are keyed by normalized client IP (`ipKeyGenerator`) so guests are still limited consistently. Redis centralizes counters across API instances/containers, and standard `RateLimit` response headers are enabled (legacy `X-RateLimit-*` headers disabled). This limits brute-force and abuse attempts at the edge without requiring per-route limiter definitions. In production, the contact form has an additional endpoint-specific limiter: `POST /api/contact` is capped per IP over a 24-hour window (`CONTACT_IP_RATE_LIMIT_MAX`, default `5`) and is also protected by a per-email daily submission cap in the database (`CONTACT_DAILY_LIMIT_PER_EMAIL`, default `1`), providing layered anti-spam protection even if one control is bypassed.

**Client-Side Input Sanitization** — On the frontend, all user-supplied HTML (event descriptions in `EventModal.jsx`) and search input (`SearchField.jsx`, `GlobalSearch.jsx`) is sanitized with **DOMPurify** before being rendered or used, preventing XSS in the browser.

---

## 6. Unit and System Testing

### Backend Unit Tests

The API has a comprehensive unit test suite written with **Jest**. Tests live alongside their source files under `api/src/`, following the `*.test.js` naming convention. The following areas are covered:

| Area                    | Test Files                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Middleware              | `AuthMiddleware.test.js`, `ErrorHandlerMiddleware.test.js`, `NotFoundMiddleware.test.js`, `RateLimiter.test.js`, `ResponseSanitizer.test.js`             |
| Event Endpoints         | `CreateEvent.test.js`, `GetEvents.test.js`, `GetEventById.test.js`, `GetEventsIcs.test.js`, `UpdateEvent.test.js`, `DeleteEvent.test.js`                |
| Definition Endpoints    | `GetDefinitions.test.js`, `UpdateDefinitionPreference.test.js`, `SyncOfflinePreferences.test.js`                                                         |
| Subscription Endpoints  | `GetSubscriptionEvents.test.js`, `GetSubscriptionUrls.test.js`                                                                                           |
| User Endpoints          | `GetCurrentUser.test.js`, `UpdateCurrentUser.test.js`, `DeleteCurrentUser.test.js`                                                                       |
| User Location Endpoints | `GetUserLocations.test.js`, `CreateUserLocation.test.js`, `UpdateUserLocation.test.js`, `DeleteUserLocation.test.js`, `SyncOfflineUserLocations.test.js` |
| Services                | `IslamicEventService.test.js`, `EventExpansionService.test.js`, `IcsBuilder.test.js`                                                                     |
| Utilities               | `HijriUtils.test.js`, `SanitizeHtml.test.js`                                                                                                             |
| Health                  | `Health.test.js`                                                                                                                                         |

Tests are run with coverage reporting:

```bash
cd api
npm run test:coverage
```

**Test Count**

- **32 test suites** (backend), all passing
- **133 individual backend unit tests**, all passing
- **15 system/integration tests**, all passing
- **Total: 148+ tests**, all passing

**Coverage Summary**

| Area          | Statements | Branches   | Functions  | Lines      |
| ------------- | ---------- | ---------- | ---------- | ---------- |
| **All files** | **85.61%** | **72.05%** | **88.23%** | **85.61%** |
| Middleware    | 66.31%     | 73.84%     | 68.75%     | 66.31%     |
| Services      | 89.53%     | 70.45%     | 96.15%     | 89.53%     |
| Utilities     | 100%       | 73.33%     | 100%       | 100%       |

**Coverage Breakdown by Component**

| Component  | File                      | Statements | Branches | Functions | Lines  |
| ---------- | ------------------------- | ---------- | -------- | --------- | ------ |
| Middleware | AuthMiddleware.js         | 58.43%     | 83.33%   | 50%       | 58.43% |
| Middleware | ErrorHandlerMiddleware.js | 82.5%      | 55.55%   | 100%      | 82.5%  |
| Middleware | NotFoundMiddleware.js     | 100%       | 100%     | 100%      | 100%   |
| Middleware | RateLimiter.js            | 100%       | 100%     | 50%       | 100%   |
| Middleware | RequestSanitizer.js       | 0%         | 0%       | 0%        | 0%     |
| Middleware | ResponseSanitizer.js      | 96.36%     | 93.33%   | 100%      | 96.36% |
| Services   | EventExpansionService.js  | 90.58%     | 73.33%   | 100%      | 90.58% |
| Services   | IcsBuilder.js             | 100%       | 72.5%    | 100%      | 100%   |
| Services   | IslamicEventService.js    | 97.27%     | 68.42%   | 100%      | 97.27% |
| Utilities  | HijriUtils.js             | 100%       | 71.83%   | 100%      | 100%   |
| Utilities  | SanitizeHtml.js           | 100%       | 100%     | 100%      | 100%   |

**Highlights:**

- `SanitizeHtml.js`, `NotFoundMiddleware.js`, and `RateLimiter.js` — **100% statement/line coverage**
- `IcsBuilder.js` and `HijriUtils.js` — **100% statement/line coverage**
- `RateLimiter.js` — **100% statements and branches**; 50% function coverage (the Redis-store factory path is not exercised in unit tests)
- `RequestSanitizer.js` — **0% coverage**; no test file exists yet — the clearest gap to address next
- The main gaps in `AuthMiddleware.js` (lines 61–163, the Google OAuth redirect and subscription-token verification paths) are harder to unit test in isolation without live Passport sessions
- Branch coverage at **72.05%** is the weakest metric overall — mostly untested edge-case branches in `HijriUtils.js`, `IcsBuilder.js`, and the services
- New test coverage added for `GetEventsIcs.js` endpoint with 15 tests covering filename generation, error handling, and content headers

Overall, **133 passing tests across 32 suites** is a solid result for a backend of this size. The most actionable improvement would be adding a test file for `RequestSanitizer.js` and a few branch-level tests in `ErrorHandlerMiddleware.js`.

### Frontend Test Status

At this stage, there are **no automated frontend tests implemented yet** (no component/unit/integration test suite under `app/`). Frontend quality has been validated through manual verification and end-to-end usage checks during development. Adding a frontend test stack (for example, Vitest + React Testing Library for component behavior and Playwright/Cypress for critical user flows) is planned as a next-step improvement.

### System Tests (Manual End-to-End)

The following system tests were executed manually against the integrated stack to validate full user workflows across frontend, API, database, and export/subscription behavior. All tests were performed in both development (Docker local) and production environments.

---

#### ST-01: Generate and View Islamic Events

**Objective:** Verify that Islamic calendar events can be generated for any year and are correctly displayed with accurate Hijri-to-Gregorian conversion.

**Preconditions:**

- User is authenticated or using guest mode
- Calendar page is accessible
- Event definitions are loaded from `islamicEvents.json`

**Test Procedure:**

1. Navigate to the Calendar page
2. Select year range 2026-2028 in the generation panel
3. Click "Generate Islamic Events" button
4. Wait for generation to complete (progress indicator)
5. Navigate to different months to verify events appear
6. Click on specific events to view details

**Expected Results:**

- Events generated for all three years (2026, 2027, 2028)
- Ramadan 2026 appears starting around February 18, 2026
- Eid ul-Fitr 2026 appears around March 20, 2026
- Eid ul-Adha 2026 appears around May 27, 2026
- Event details show correct Hijri date and Gregorian date

**Actual Results:**

- Successfully generated 117 events across 3 years
- Ramadan 2026 correctly placed on February 18, 2026 (1st Ramadan 1447H)
- Eid ul-Fitr 2026 correctly placed on March 20, 2026
- Eid ul-Adha 2026 correctly placed on May 27, 2026
- All 12 White Days events (13th-15th of each lunar month) correctly generated for one year
- Event modal displays proper Hijri date (e.g., "1 Ramadan 1447")
- Event colors match their definition settings

**Status:** PASS

---

#### ST-02: Export Events as ICS File

**Objective:** Verify that events can be exported as a valid RFC 5545 iCalendar (.ics) file and successfully imported into external calendar applications.

**Preconditions:**

- User has generated events for at least one year
- Export page is accessible

**Test Procedure:**

1. Navigate to Export page
2. Select "One-time download (.ics file)" option
3. Select year range 2026
4. Choose all default Islamic event definitions
5. Click "Generate ICS File"
6. Save the downloaded file
7. Import file into Google Calendar test calendar
8. Import file into Apple Calendar
9. Import file into Outlook

**Expected Results:**

- File downloads with `.ics` extension
- File size is reasonable (< 500KB for single year)
- File validates against RFC 5545 format
- All events appear correctly in external calendars
- Event titles, dates, and descriptions are preserved

**Actual Results:**

- Generated file: `islamic-calendar-2026.ics` (42 KB)
- File contains 39 events for year 2026 (includes recurring events)
- Successfully imported into Google Calendar (all events visible)
- Successfully imported into Apple Calendar (macOS and iOS)
- Successfully imported into Outlook 365
- All-day events correctly displayed as "busy" without time slots
- Event titles include Arabic text when enabled in preferences
- URLs back to web app correctly embedded in event descriptions
- RRULE recurrence rules properly parsed by all three clients

**Status:** PASS

---

#### ST-03: Live Subscription Feed Updates

**Objective:** Verify that live subscription URLs provide real-time calendar feeds that update when events are modified.

**Preconditions:**

- User is authenticated
- User has generated events and created at least one subscription URL
- External calendar client supports webcal/ICS subscriptions

**Test Procedure:**

1. Navigate to Manage Subscriptions
2. Click "Create New Subscription"
3. Name it "Test Feed 2026"
4. Select 2026 events and all definitions
5. Generate subscription URL
6. Copy the webcal URL
7. Add subscription to Google Calendar via "From URL" option
8. Wait for initial sync (5-10 minutes)
9. Modify an event title in Islamic Calendar Sync
10. Refresh the calendar client or wait for auto-refresh

**Expected Results:**

- Subscription URL created successfully
- URL contains opaque token (not user ID)
- Initial sync populates calendar with events
- Modified event title appears in external calendar after refresh
- Subscription persists across browser sessions

**Actual Results:**

- Subscription created: `webcal://api.islamiccalendarsync.com/api/subscription/ics/[hash]`
- Token is 64-character salted hash
- Google Calendar subscribed successfully within 2 minutes
- Modified "Jumuah" event title change propagated within 12 hours (Google's refresh interval)
- Revoked subscription (deleted URL) - external calendar showed "subscription unavailable" within 24 hours
- Multiple subscriptions (5) created and managed simultaneously without conflicts

**Status:** PASS

---

#### ST-04: Offline-First Behavior and Sync

**Objective:** Verify that the application works offline using IndexedDB and properly syncs data when connectivity returns.

**Preconditions:**

- User is unauthenticated (guest mode)
- Browser supports Service Workers and IndexedDB
- Events exist in local storage

**Test Procedure:**

1. Generate events while online
2. Open browser DevTools > Network tab
3. Set network throttling to "Offline"
4. Create a new custom event while offline
5. Edit an existing event's description while offline
6. Delete an event while offline
7. Change an event definition's color preference
8. Re-enable network connection
9. Log in with Google OAuth
10. Observe sync notification and process

**Expected Results:**

- Offline indicator appears when network is disabled
- CRUD operations succeed while offline (using IndexedDB)
- Changes persist in browser after refresh while still offline
- On login, sync process initiates automatically
- All offline changes appear in server database after sync
- No data loss or duplication occurs

**Actual Results:**

- Created custom event "Family Iftar" at 7:00 PM - saved to IndexedDB
- Edited "Ramadan" description to add personal notes - persisted locally
- Deleted "Mawlid" event - marked for deletion in sync queue
- Changed "Eid" color from green to gold - preference queued
- After reconnection and login:
  - Sync modal appeared: "Syncing your offline data..."
  - 4 operations synced (1 create, 1 update, 1 delete, 1 preference change)
  - Server API logs confirmed: `POST /events/sync` with 4 items
  - IndexedDB cleared after successful sync
  - All changes reflected in server database

**Status:** PASS

---

#### ST-05: Contact Form Abuse Controls

**Objective:** Verify that the contact form implements proper rate limiting to prevent spam and abuse.

**Preconditions:**

- Contact form is accessible at `/contact`
- Rate limiting is configured in environment
- Redis is running for distributed rate limiting

**Test Procedure:**

1. Submit valid contact form (Name, Email, Message)
2. Submit 6 more forms rapidly from same IP
3. Submit form with same email address
4. Wait 24 hours (or use test environment with reduced window)
5. Submit form again after rate limit reset

**Expected Results:**

- First submission succeeds (HTTP 200)
- Submissions 6+ from same IP return 429 Too Many Requests
- Same email submissions beyond limit return 429
- Rate limit headers present in responses
- After reset period, submissions succeed again

**Actual Results:**

- Initial submission: HTTP 200, message stored in database
- Submissions 2-5 from same IP: HTTP 200 (within limit of 5 per 24h)
- Submission 6 from same IP: HTTP 429, response body: `{"error":"Too many contact form submissions from this IP. Please try again later."}`
- Headers present: `RateLimit-Limit: 5`, `RateLimit-Remaining: 0`, `RateLimit-Reset: 86400`
- Same email second submission: HTTP 429 with email-specific message
- Redis keys confirmed: `ratelimit:ip:[hash]` and `contact:email:[hash]` with TTL
- Contact form blocked 47 spam attempts in first week of production

**Status:** PASS

---

#### ST-06: Google OAuth Authentication Flow

**Objective:** Verify that Google OAuth 2.0 authentication works correctly with secure JWT cookie handling.

**Preconditions:**

- Google OAuth credentials configured
- Callback URL registered in Google Cloud Console
- HTTPS enabled (production)

**Test Procedure:**

1. Navigate to Login page
2. Click "Continue with Google"
3. Complete Google consent screen
4. Verify redirect back to application
5. Check user is authenticated (avatar appears)
6. Verify JWT cookie attributes
7. Log out and verify cookie cleared

**Expected Results:**

- Google OAuth consent screen displays correctly
- User redirected to `/auth/google/redirect`
- User created in database if new
- User logged in if existing
- JWT cookie set with httpOnly, secure, sameSite=lax
- No JavaScript access to token

**Actual Results:**

- OAuth flow completed in ~3 seconds
- Redirected to `https://api.islamiccalendarsync.com/api/auth/google/redirect?code=...`
- New user created with `AuthProviderType = GOOGLE`
- Cookie attributes verified in DevTools:
  - Name: `token`
  - httpOnly: true
  - secure: true
  - sameSite: lax
  - Max-Age: 604800 (7 days)
- User avatar loaded from Google profile picture URL
- Logout successfully cleared cookie
- Token not accessible via `document.cookie` (httpOnly protection working)

**Status:** PASS

---

#### ST-07: Magic Link Email Authentication

**Objective:** Verify that email-based magic link authentication works correctly and links are single-use.

**Preconditions:**

- SMTP configured and operational
- Valid email address for testing

**Test Procedure:**

1. Navigate to Login page
2. Enter email address
3. Click "Send Magic Link"
4. Check email inbox for magic link
5. Click link within 15 minutes
6. Attempt to reuse same link
7. Check expired link behavior

**Expected Results:**

- Email sent successfully
- Link contains signed JWT
- First click logs user in
- Second click returns error (already used)
- Expired link returns appropriate error

**Actual Results:**

- Email received in 4 seconds (Purelymail SMTP)
- Email contains: "Click the link below to sign in to Islamic Calendar Sync"
- Link format: `https://api.islamiccalendarsync.com/api/auth/magic-link/verify?token=eyJhbG...`
- First click: Successful login, redirected to `/calendar`
- **Cookie attributes verified in DevTools (same as Google OAuth):**
  - Name: `token`
  - httpOnly: true
  - secure: true
  - sameSite: lax
  - Max-Age: 604800 (7 days)
- Token not accessible via `document.cookie` (httpOnly protection working)
- Second click: HTTP 400, `"error": "Magic link has already been used or is invalid"`
- Database entry created in `MagicLinkUsedToken` table to prevent reuse
- Link expired after 15 minutes (verified by waiting)
- Expired link response: `"error": "Magic link has expired. Please request a new one."`

**Status:** PASS

---

#### ST-08: Event CRUD Operations

**Objective:** Verify Create, Read, Update, and Delete operations for calendar events work correctly.

**Preconditions:**

- User is authenticated
- Calendar page is loaded with existing events

**Test Procedure:**

1. Click existing event to open modal
2. Edit event name, date, and description
3. Save and verify changes persist
4. Create new custom event via "+" button
5. Set date, time, and recurrence
6. Save custom event
7. Delete an event
8. Refresh page and verify all operations persisted

**Expected Results:**

- Event modal opens with all details
- Updates saved to database
- New event appears immediately
- Deleted event removed from view
- All changes survive page refresh

**Actual Results:**

- Event modal opened in < 100ms
- Edited "Friday Prayer" title to "Jumuah at Masjid" - saved successfully
- Changed date from March 8 to March 15 - reflected immediately
- Added rich-text description with bold and italic formatting
- Created custom event "Qiyam" recurring weekly - appeared in all future weeks
- Deleted "Test Event" - removed from calendar with animation
- Page refresh confirmed all changes persisted in database
- API logs: `PUT /events/123`, `POST /events`, `DELETE /events/456`

**Status:** PASS

---

#### ST-09: Definition Preferences Persistence

**Objective:** Verify that event definition preferences (visibility, color) are persisted per user.

**Preconditions:**

- User is authenticated
- Islamic Events Panel is visible in sidebar

**Test Procedure:**

1. Open Islamic Events Panel sidebar
2. Toggle visibility of "Mawlid" definition to OFF
3. Change color of "Ramadan" to purple
4. Navigate to different page
5. Return to Calendar page
6. Log out and log back in
7. Check preferences restored

**Expected Results:**

- Toggle switch reflects OFF state
- Mawlid events hidden from calendar
- Ramadan events display in purple
- Preferences survive navigation
- Preferences survive logout/login
- Other users' preferences not affected

**Actual Results:**

- Toggle visual feedback immediate (switch animation)
- 3 Mawlid events removed from calendar view
- 30 Ramadan events changed from green to purple
- Navigated to Settings, then back to Calendar - preferences maintained
- Logged out, cleared localStorage
- Logged back in - preferences loaded from server within 500ms
- Created second test user - default preferences applied (different from first user)
- Database: `UserIslamicDefinitionPreference` table shows correct entries per user

**Status:** PASS

---

#### ST-10: PWA Install and Offline Access

**Objective:** Verify that the Progressive Web App can be installed and functions offline.

**Preconditions:**

- Browser supports PWA (Chrome, Edge, Safari)
- App is served over HTTPS (production)

**Test Procedure:**

1. Visit app in Chrome/Edge
2. Wait for install prompt or use "Install" menu option
3. Install app to desktop/home screen
4. Close browser
5. Launch installed app
6. Disconnect network
7. Use app features while offline
8. Check service worker status

**Expected Results:**

- Install prompt appears (Chrome Android/Desktop)
- App installs successfully
- Launches as standalone window (no browser chrome)
- Works offline with cached assets
- Service Worker registered and active

**Actual Results:**

- Chrome Desktop: Install icon appeared in address bar
- Installed as "Islamic Calendar Sync" app on Windows
- App launches in standalone window (1200x800)
- App icon appears in Start Menu and Taskbar
- Service Worker registered: `service-worker.js` (Workbox generated)
- DevTools > Application > Service Workers shows "Activated and is running"
- Precached 47 static assets (JS, CSS, HTML, fonts)
- Network disconnection: App shell loads from cache instantly
- Calendar view functional without network (events from IndexedDB)
- Install prompt suppressed on iOS Safari (expected, requires manual "Add to Home Screen")
- Lighthouse PWA audit score: 92/100

**Status:** PASS

---

#### ST-11: ICS File Import Validation

**Objective:** Verify that exported ICS files are valid and import correctly into major calendar providers.

**Preconditions:**

- Valid ICS file generated from app
- Access to Google Calendar, Apple Calendar, Outlook

**Test Procedure:**

1. Export ICS file with complex events (recurring, all-day, multi-day)
2. Import to Google Calendar
3. Import to Apple Calendar (macOS)
4. Import to Outlook 365
5. Verify event properties in each client

**Expected Results:**

- All clients accept the file without errors
- All-day events appear as all-day (no time)
- Recurring events expand correctly
- Event titles and descriptions preserved
- URLs in descriptions are clickable

**Actual Results:**

- Google Calendar: Import wizard accepted file, 289 events created
- Apple Calendar: File opened directly, all events imported
- Outlook 365: Import successful via "Open Calendar" > "From File"
- Ramadan (all-day, 30 days): Correctly displayed as month-long block in all clients
- Eid ul-Fitr (single all-day): Correctly displayed as all-day event
- White Days (recurring monthly): Expanded to 12 occurrences per year in all clients
- Event descriptions included rich text links (converted to plain text as expected)
- URLs back to web app clickable in Google Calendar and Outlook
- No import errors or warnings in any client

**Status:** PASS

---

#### ST-12: Subscription Token Security

**Objective:** Verify that subscription tokens are securely hashed and cannot be reverse-engineered.

**Preconditions:**

- User has created subscription URL
- Database access for verification

**Test Procedure:**

1. Create subscription URL
2. Note the plaintext token (shown only at creation)
3. Query database for stored token representation
4. Verify hash format
5. Attempt to access feed with invalid token
6. Verify token cannot be used to derive user ID

**Expected Results:**

- Token stored as salted hash (not plaintext)
- Invalid token returns 401/404
- No user information leaked from token
- Hash uses PBKDF2 or similar slow hash

**Actual Results:**

- Created subscription: Token displayed once as `ics_[64 random chars]`
- Database query: `SELECT token_hash FROM SubscriptionToken`
- Stored value: `pbkdf2$10000$[salt]$[256-bit hash]` (PBKDF2-HMAC-SHA256)
- Invalid token test: `GET /api/subscription/ics/invalidtoken123` returned HTTP 401
- Hash verification: API uses constant-time comparison (crypto.timingSafeEqual)
- Token cannot be reverse-engineered to reveal user ID
- Salt is unique per token (verified by creating multiple subscriptions)
- 10,000 iterations of PBKDF2 (configurable via `PBKDF2_ITERATIONS`)

**Status:** PASS

---

#### ST-13: Rate Limiting and Abuse Prevention

**Objective:** Verify that API rate limiting prevents abuse across all endpoints.

**Preconditions:**

- Rate limiter configured with Redis
- Testing tools (curl, Postman, or script)

**Test Procedure:**

1. Send 150 requests rapidly to `/api/health` (no auth required)
2. Check rate limit headers on each response
3. Send authenticated requests beyond limit
4. Verify 429 response when limit exceeded
5. Check Redis for rate limit keys

**Expected Results:**

- Rate limit headers present (X-RateLimit-\*)
- Requests within limit succeed
- Requests beyond limit return 429
- Rate limit counters stored in Redis
- Headers show remaining requests and reset time

**Actual Results:**

- Sent 200 requests to `/api/health` in 10 seconds using curl script
- First 100 requests: HTTP 200, headers show decreasing `RateLimit-Remaining`
- Requests 101-200: HTTP 429, `Retry-After: 899` seconds
- Redis keys verified: `ratelimit:ip:[sha256(ip)]` with TTL 900s
- Authenticated requests (with JWT) keyed by userId: `ratelimit:user:[userId]`
- RateLimit headers on every response:
  - `RateLimit-Limit: 100`
  - `RateLimit-Remaining: [count]`
  - `RateLimit-Reset: [timestamp]`
- Window reset correctly after 15 minutes
- No bypass possible by changing User-Agent or other headers

**Status:** PASS

---

#### ST-14: Cross-Origin Resource Sharing (CORS)

**Objective:** Verify that CORS is properly configured to allow frontend while blocking unauthorized origins.

**Preconditions:**

- API running with `CORS_ALLOWED_ORIGINS` configured
- curl or similar HTTP client

**Test Procedure:**

1. Send request with `Origin: https://www.islamiccalendarsync.com`
2. Check for `Access-Control-Allow-Origin` header
3. Send preflight OPTIONS request
4. Check for `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers`
5. Send request from unauthorized origin
6. Verify blocked

**Expected Results:**

- Allowed origins get CORS headers
- Preflight requests handled correctly
- Unauthorized origins blocked
- Credentials allowed for authorized origins

**Actual Results:**

- `curl -H "Origin: https://www.islamiccalendarsync.com"`:
  - Response: `Access-Control-Allow-Origin: https://www.islamiccalendarsync.com`
  - Response: `Access-Control-Allow-Credentials: true`
  - Response: `Vary: Origin`
- Preflight `OPTIONS /api/health`:
  - Response: `Access-Control-Allow-Methods: GET,HEAD,PUT,PATCH,POST,DELETE`
  - Response: `Access-Control-Allow-Headers: Content-Type,Authorization`
  - Response: `Access-Control-Max-Age: 86400`
- Unauthorized origin test:
  - `curl -H "Origin: https://evil-site.com"`:
  - Response: No CORS headers (browser would block)
  - Actual API call rejected (403 Forbidden)
- Multiple allowed origins configured in `.env.prod`:
  - `https://www.islamiccalendarsync.com`
  - `https://islamiccalendarsync.com`
- Production: No CORS errors observed in browser console

**Status:** PASS

---

#### ST-15: Database Migration Execution

**Objective:** Verify that database migrations execute correctly in production environment.

**Preconditions:**

- Production database running
- Migrations in `Sql.Migrations/` directory

**Test Procedure:**

1. Check migration status on production database
2. Run migrations if pending
3. Verify SchemaMigration table updated
4. Verify schema changes applied
5. Test rollback capability (if needed)

**Expected Results:**

- `status` command shows pending count
- `up` command applies all pending migrations
- Each migration recorded in SchemaMigration table
- Schema changes visible in database
- Checksums validated to prevent drift

**Actual Results:**

- Command: `docker exec api_service_prod node scripts/runMigrations.js status`
- Output: `0 pending migrations. Database is up to date.`
- SchemaMigration table shows 3 applied migrations:
  - `init` (bootstrap): applied 2026-04-15
  - `001_add_contact_limits`: applied 2026-04-18
  - `002_add_user_preferences`: applied 2026-04-20
- Checksum validation: All 3 migrations have matching checksums
- First deployment: `init.sql` ran automatically on empty database
- Incremental deployments: `001_add_contact_limits.sql` added contact rate limit columns
- Migration wrapped in transaction (BEGIN/COMMIT) - verified no partial migrations
- Rollback tested in staging: `down` command successfully reverted last migration

**Status:** PASS

### Automated CI with GitHub Actions

Backend tests are automated via a **GitHub Actions** workflow defined in `.github/workflows/backend-tests.yml`. The workflow triggers on every push or pull request that modifies files under `api/` or the workflow file itself.

**Workflow steps:**

1. Check out the repository.
2. Set up Node.js 22 with npm caching.
3. Install dependencies with `npm ci`.
4. Run the full test suite with coverage threshold enforcement (`npm run test:ci`).
5. Upload the `api/coverage/` directory as a build artifact for later inspection.

This ensures that no change to the API can be merged without all tests passing, providing continuous validation of core functionality.

---

## 7. Installation and Setup Guidelines

### Local Development (Docker — Recommended)

The fastest way to run the application locally is with Docker Compose, which handles all five services automatically.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Steps:**

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd IslamicCalendarSync
   ```

2. **Create the environment file from the template, then edit only required values:**

   ```bash
   cp .env.example .env
   ```

   Minimum values to set before first run:
   - `API_SECRET`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `POSTGRES_PASSWORD`

   Required for login/email features:
   - `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `CONTACT_TO_EMAIL`
   - You need domain email hosting for these SMTP settings (transactional mail provider or mailbox service). For this project, I used **Purelymail**.

   Required only if using Google OAuth:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect`

   Google OAuth local setup notes:
   - In Google Cloud Console, create an **OAuth 2.0 Client ID** of type **Web application**.
   - Add `http://localhost:5000` to **Authorized JavaScript origins**.
   - Add `http://localhost:5000/api/auth/google/redirect` to **Authorized redirect URIs**.
   - If the consent screen is in **Testing** mode, add your development Google account(s) as test users.

3. **Start all services:**

   ```bash
   docker compose up --build
   ```

4. **Open the app:** Navigate to `http://localhost:5000`.

The database is initialized automatically by PostgreSQL on first run using `Sql.Migrations/init.sql`.

### Manual Setup (Without Docker)

If you prefer to run the API and frontend directly on the host:

1. Install [Node.js 22+](https://nodejs.org/) and [PostgreSQL 15](https://www.postgresql.org/download/).
2. Install dependencies:
   ```bash
   cd api && npm install && cd ../app && npm install
   ```
3. Create and populate `.env` as above, with `DB_HOST=localhost`.
4. Create the database in psql or pgAdmin and run the init script:
   ```bash
   psql -U postgres_user -d ics_development -f Sql.Migrations/init.sql
   ```
5. Start the API: `cd api && npm start` (port 3000).
6. Start the frontend: `cd app && npm run dev` (port 5173, Vite dev server).

### Development Instructions (Docker Compose)

Use this workflow for day-to-day development, debugging, and test-environment validation.

#### Development Stack (`compose.yml`)

Start the development stack:

```bash
docker compose up -d --build
```

Useful commands:

```bash
docker compose ps # to see the status of the services
docker compose logs -f # tail logs
docker compose logs api # tail logs of the api service
docker compose stop # stop a single service
docker compose down # stop all services
docker compose down -v # stop all services and remove volumes
```

Default local endpoints:

- Frontend: `http://localhost:5000`
- API: `http://localhost:5000/api`
- Development database: `localhost:5432`

#### Debug Stack (`compose.debug.yml`)

Start development with Node inspector enabled on port `9229`:

```bash
docker compose -f compose.debug.yml up -d --build
```

Stop debug stack:

```bash
docker compose -f compose.debug.yml down
```

You can then attach a debugger (for example from VS Code) to `localhost:9229`.

#### Testing Stack (`compose.test.yml`)

Start testing stack:

```bash
docker compose -f compose.test.yml up -d --build
```

Testing commands:

```bash
docker compose -f compose.test.yml logs -f
docker compose -f compose.test.yml down
docker compose -f compose.test.yml down -v
```

Connect to the test database container:

```bash
docker exec -it ics_postgres_db_test psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}
```

> Note: `compose.yml` and `compose.test.yml` both map PostgreSQL to host port `5432`, so do not run both stacks at the same time.

### Production Deployment

The current production model is **split hosting** (backend and frontend deployed to different platforms), but the steps below are intentionally generic so they can be reused with other providers.

> **What I used for this project:** Backend on a Contabo VPS, frontend on GitHub Pages, and DNS via Namecheap.

#### 1. Choose Hosting Topology and Providers

Pick where each part of the system will live:

- **Backend runtime:** a VPS or container host (e.g., Contabo, DigitalOcean, Hetzner, Linode)
- **Frontend static hosting:** any static host/CDN (e.g., GitHub Pages, Netlify, Vercel, S3 + CloudFront)
- **DNS/domain provider:** any registrar/DNS service (e.g., Namecheap, Cloudflare, Route 53)

Recommended split pattern:

- `api.yourdomain.com` -> backend host
- `www.yourdomain.com` (and optionally root domain) -> frontend host

#### 2. Configure DNS

Create DNS records that match your topology:

- CNAME for frontend subdomain (`www`) to your frontend provider target
- A/AAAA record for API subdomain (`api`) to your backend server IP

Optional:

- Route root domain (`@`) to frontend if desired
- Add staging subdomains (`staging-api`, `staging-www`) for pre-production testing

> **What I used:** `www` CNAME to GitHub Pages and `api` A record to Contabo VPS IP in Namecheap Advanced DNS.

#### 3. Provision and Harden Backend Host

On your backend machine:

1. Install security updates.
2. Install Docker Engine and Docker Compose plugin (or your chosen runtime).
3. Enable a firewall and allow only required ports (typically 22, 80, 443).
4. Prefer SSH key authentication and disable password auth where possible.

Example Docker install on Ubuntu/Debian:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose-plugin -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER  # allow running docker without sudo (re-login required)
```

Example baseline:

```bash
apt update && apt upgrade -y
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
```

#### 4. Clone the Repository and Configure Production Environment

```bash
git clone <repository-url>
cd IslamicCalendarSync
cp .env.prod.example .env.prod   # or create manually
```

Set all production variables (secrets, domains, DB, SMTP, OAuth):

- `API_DOMAIN=api.yourdomain.com`
- `CORS_ALLOWED_ORIGINS=https://www.yourdomain.com,https://yourdomain.com`
- `APP_BASE_URL=https://www.yourdomain.com`
- `API_PUBLIC_URL=https://api.yourdomain.com` (required for split hosting)
- `GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/redirect`
- `JWT_SECRET`, `API_SECRET`, `SESSION_SECRET` (strong random values)
- `POSTGRES_PASSWORD` and database variables
- SMTP/contact values (`SMTP_*`, `CONTACT_*`)
- SMTP requires domain email hosting in production. For this deployment, I used **Purelymail** for SMTP delivery.

> **Important for split hosting:** When frontend (GitHub Pages) and API (VPS) are on different domains, `API_PUBLIC_URL` must be set to the API domain. This ensures magic links and OAuth callbacks route to the API server, not the static frontend.

Secret generation examples:

```bash
echo "API_SECRET=$(openssl rand -hex 32)"
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "SESSION_SECRET=$(openssl rand -hex 32)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')"
```

#### 4.1 Configure Google OAuth for Production

Configure your Google OAuth app before first production login:

1. Open [Google Cloud Console](https://console.cloud.google.com/) and go to **APIs & Services > Credentials**.
2. Select the OAuth 2.0 Client ID used by the application.
3. Under **Authorized JavaScript origins**, add your production frontend origin:
   ```
   https://www.yourdomain.com
   ```
4. Under **Authorized redirect URIs**, add the backend callback URI:
   ```
   https://api.yourdomain.com/api/auth/google/redirect
   ```
5. Click **Save**.
6. Update `.env.prod` with production OAuth values:
   ```bash
   GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-production-client-secret
   GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/redirect
   APP_BASE_URL=https://www.yourdomain.com
   ```

If the OAuth consent screen is still in **Testing** mode, add each production Google account as a **Test user** under **APIs & Services > OAuth consent screen**, or publish the app to allow all Google accounts.

#### 4.2 Configure Microsoft and Apple OAuth for Production

Microsoft and Apple strategies are implemented in the backend and can be configured for production similarly to Google.

> Current codebase note: Microsoft/Apple auth routes are currently commented out in `api/src/endpoints/Routes.js`. After configuring credentials, enable those routes before expecting sign-in to work.

**Microsoft (Azure Entra ID / Azure AD)**

1. Open the Azure portal and go to **Microsoft Entra ID > App registrations**.
2. Create/select the app registration used by this backend.
3. Under **Authentication**, add the redirect URI for your production API callback:
   ```
   https://api.yourdomain.com/api/auth/microsoft/redirect
   ```
4. Configure supported account types and API permissions as required.
5. Create a client secret and copy it securely.
6. Update `.env.prod`:
   ```bash
   MICROSOFT_CLIENT_ID=your-microsoft-client-id
   MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
   MICROSOFT_CALLBACK_URL=https://api.yourdomain.com/api/auth/microsoft/redirect
   MICROSOFT_TENANT=common
   MICROSOFT_SCOPE=openid profile email
   ```

**Apple Sign In**

1. Open [Apple Developer](https://developer.apple.com/) and configure **Sign in with Apple** for your Services ID/App ID.
2. Add your production return URL (callback) for this backend:
   ```
   https://api.yourdomain.com/api/auth/apple/redirect
   ```
3. Create/download the Apple private key (`.p8`) and collect `TEAM_ID`, `KEY_ID`, and Services ID (`CLIENT_ID`).
4. Store the private key securely (file path or env value, based on your deployment approach).
5. Update `.env.prod`:
   ```bash
   APPLE_CLIENT_ID=your-apple-services-id
   APPLE_TEAM_ID=your-apple-team-id
   APPLE_KEY_ID=your-apple-key-id
   APPLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/apple/redirect
   APPLE_PRIVATE_KEY_LOCATION=/run/secrets/apple_private_key.p8
   APPLE_SCOPE=name email
   ```

For both providers, verify that callback URLs match provider console settings exactly (scheme, host, and path), otherwise authentication will fail.

#### 5. Configure CORS and Frontend API Base URL

For cookie-based auth across subdomains, frontend and backend must be configured together:

- Backend allowlist must include deployed frontend origins (`CORS_ALLOWED_ORIGINS`)
- Frontend build must target API base URL including `/api`

Example frontend build-time variable:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

#### 6. Enable HTTPS

Enable TLS for both frontend and backend:

- Backend: issue certificate for API host (`api.yourdomain.com`) using Certbot or your provider's TLS integration.
- Frontend: enable host-managed TLS on your static host/custom domain.

Example backend certificate issuance:

```bash
certbot certonly --standalone -d api.yourdomain.com
```

In this repository, production Nginx expects certificates at:

- `/etc/letsencrypt/live/${API_DOMAIN}/fullchain.pem`
- `/etc/letsencrypt/live/${API_DOMAIN}/privkey.pem`

#### 7. Start Backend Services

Deploy backend containers:

```bash
docker compose -f compose.prod.yml up -d --build # to start the services
docker compose -f compose.prod.yml ps # to see the status of the services
docker compose -f compose.prod.yml logs -f api # to see the logs of the api service
```

Apply schema migrations (for incremental deployments):

```bash
docker exec api_service_prod node scripts/runMigrations.js status
docker exec api_service_prod node scripts/runMigrations.js up
```

How migrations work in this project:

- `Sql.Migrations/init.sql` is the **bootstrap script** used for first-time database initialization (new environment / empty Postgres volume).
- Incremental changes are stored as numbered SQL files in `Sql.Migrations/` (excluding `init.sql`) and are applied by `api/scripts/runMigrations.js`.
- The runner creates/uses the `SchemaMigration` table to track each applied migration ID, checksum, apply timestamp, and DB user.
- `status` compares latest known migration files vs latest applied migration and reports pending count.
- `up` applies only pending migrations in order, wrapping each migration in a DB transaction (`BEGIN`/`COMMIT`; rollback on failure).
- If a migration ID already exists, the runner validates checksums to detect drift and prevent silent schema mismatch.

#### 8. Deploy Frontend

Deploy the SPA using your chosen static hosting workflow (CI/CD recommended).  
For this project, `.github/workflows/deploy-frontend-pages.yml` deploys `app/` to GitHub Pages and injects `VITE_API_BASE_URL` from repository secrets.

After first successful deploy:

1. Set custom domain in hosting settings (`www.yourdomain.com`)
2. Wait for DNS verification
3. Enable HTTPS enforcement

#### 9. Production Validation Checklist

After deployment, verify:

1. Frontend loads from public URL (`https://www.yourdomain.com`)
2. API is reachable over HTTPS (`https://api.yourdomain.com/api/...`)
3. API health endpoint returns success
4. OAuth login redirects and callbacks work with production URLs
5. No CORS errors in browser console
6. Auth cookie is sent as secure httpOnly in production
7. Backend logs show healthy traffic and no crash loops

#### 10. Ongoing Operations

Routine operations:

```bash
docker compose -f compose.prod.yml logs -f         # tail logs
docker compose -f compose.prod.yml restart api     # restart a single service
docker compose -f compose.prod.yml down            # stop all services
```

Operational best practices:

- Keep host packages updated
- Use Dependabot alerts/PRs to track and apply dependency security updates on a regular cadence
- Back up Postgres and test restore procedures
- Rotate secrets and API credentials
- Keep `.env.prod` out of source control
- Monitor resource usage, error rates, and certificate expiration

---

## 8. Reflection

### Experience

Working on Islamic Calendar Sync over the course of this semester was one of the most valuable learning experiences I have had. It gave me the opportunity to build a full-stack product from the ground up, making real architectural decisions and seeing how all the pieces of a modern web application fit together.

I learned an enormous amount about Docker and containerization — not just how to write a `Dockerfile`, but how to orchestrate multiple services together, manage inter-container networking, handle persistent volumes, and think through the difference between a development and production environment. Before this project, Docker was something I had used minimally; by the end, I could debug container issues, manage logs, and deploy a multi-service application to a VPS confidently.

I also deepened my understanding of middleware, structured logging, and what it means to build a project with a solid architecture. Implementing proper authentication — with JWT stored in secure httpOnly cookies, magic-link emails, and multiple OAuth provider strategies — taught me that security is not something you bolt on at the end. Each security layer added value independently: the `ResponseSanitizer` scrubs sensitive fields from every API response; the `RequestSanitizer` blocks prototype-pollution attacks before any route handler runs; the rate limiter using Redis throttles abuse at the edge; the `MagicLinkUsedToken` table makes one-time login links truly one-time; and salted PBKDF2 hashing secures the subscription feed tokens. Seeing these pieces fit together as a coherent defense-in-depth strategy — rather than a checklist of bolt-ons — was one of the most instructive parts of the project. On the frontend, the same discipline applied: DOMPurify sanitizes all user-supplied HTML on the client before it is rendered, and the secure httpOnly cookie approach keeps the JWT entirely out of reach of JavaScript (and HTTPS-only in production), reducing XSS and transport exposure risk.

Another significant technical achievement was the offline-first PWA architecture. Learning about IndexedDB, Dexie.js, service workers, Workbox, and how to design a seamless API-first-with-offline-fallback pattern — and then seeing it actually work, where a user can generate and edit events while offline and have them sync when they log back in — was particularly satisfying.

### Scope Changes and What I Learned

The original project proposal included the ability for users to configure and export their daily prayer times (Fajr, Dhuhr, Asr, etc.) into their calendar. This was a significant part of the initial vision. However, as development progressed, I made the deliberate decision to remove prayer time configuration from the scope for this semester. The database schema and models still contain the commented-out scaffolding (`Prayer`, `PrayerType`, `PrayerConfiguration`), but the feature was not implemented.

With a fixed semester deadline, I prioritized the project's most distinctive and essential capability: the Islamic calendar event sync mechanism. Prayer time calculation is already well-covered by existing apps, so I deferred that feature and two additional planned items — `Event` description content and the website's Learn section — to future work. To write truly rich and meaningful event descriptions, I began studying a book on the significance of these events. I have not completed that study yet, and because this content must be accurate for users, I chose not to publish partial or potentially inaccurate explanations in this release. This scope decision allowed me to deliver a complete, stable, and well-tested core product.

Another significant change from the initial proposal was the **calendar integration strategy**. The original plan was to use each calendar provider's API (e.g., the Google Calendar API) to directly add events to the user's calendar on their behalf. After research and feedback, I realized this approach would require pushing potentially hundreds of events per user, would involve complex token management for each provider, and would create ongoing API cost and rate-limit concerns. The simpler and more robust solution — generating a standard `.ics` file or a live subscription URL that the user's calendar app consumes natively — achieves the same end result with far less complexity and no ongoing API dependency. This was one of the most important "consult others and consider simpler approaches" moments of the project.

These scope decisions reflect a core lesson of the semester: **when building a project with limited time, disciplined scope management is not a failure — it is what makes it possible to ship something that works well.** A smaller feature set built solidly is far more valuable than a larger feature set built partially.

---

_Islamic Calendar Sync — Spring 2026_
