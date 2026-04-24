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

**Islamic Calendar Sync** is a tool and platform designed to solve this problem. It is a web application for Muslims with busy lives to stay in sync with the Islamic calendar. Users can select which Islamic days and months matter most to them and either download events as an `.ics` file for a one-time import, or subscribe to a live calendar feed URL that automatically stays up to date in their calendar application of choice (Google Calendar, Apple Calendar, Outlook, etc.).

The real value lies in the description of each event. Rather than a simple label, each event description contains the significance behind it, how to attain maximum reward by practicing it correctly, relevant supplications, and more. This way Muslims will be reminded of what matters — not just that a day is significant, but why it is significant and what to do about it — thus strengthening their connection with God through staying in sync with the sacred days of the Islamic calendar.

### Project Goals

- Provide accurate, Hijri-to-Gregorian date conversion for Islamic events.
- Allow users to select which event definitions they want and generate calendar events for any year range.
- Deliver events with rich, meaningful descriptions, not just names.
- Support export via `.ics` file download and via live subscription URL (webcal/iCal feed).
- Support both authenticated users (with server-persisted preferences) and unauthenticated guests (with full offline/local-storage functionality).
- Build a Progressive Web App (PWA) that is installable and works offline.

---

## 2. Requirements

The following use cases describe the functional requirements of the system. They were tracked as GitHub Issues throughout development.

### Authentication and Accounts

| UC | Use Case | Description |
|----|----------|-------------|
| UC-01 | Register with Email | A user can register for an account using their email address. A magic-link email is sent to verify the address. |
| UC-02 | Login with Google OAuth | A user can log in using their Google account via OAuth 2.0 (OIDC). |
| UC-03 | Login with Microsoft OAuth | A user can log in using their Microsoft account via OAuth 2.0. |
| UC-04 | Login with Apple OAuth | A user can log in using their Apple ID via OAuth 2.0. |
| UC-05 | Login with Magic Link Email | A user can log in by entering their email and receiving a one-time login link. |
| UC-06 | Logout | An authenticated user can log out, clearing their session. |
| UC-07 | Delete Account | An authenticated user can permanently delete their account and all associated data. |

### Event Definitions and Preferences

| UC | Use Case | Description |
|----|----------|-------------|
| UC-08 | View Islamic Event Definitions | A user can view all available Islamic event definitions (e.g., Ramadan, Ashura, Eid ul-Fitr, White Days) from the sidebar panel. |
| UC-09 | Show/Hide Definitions | A user can toggle the visibility of individual Islamic event definitions, hiding events they do not want displayed. |
| UC-10 | Set Default Color for Definition | A user can assign a custom color to an event definition, which is applied to all events generated from that definition. |
| UC-11 | Persist Definition Preferences | Preference changes (show/hide, color) are saved and persisted for authenticated users. |

### Event Management

| UC | Use Case | Description |
|----|----------|-------------|
| UC-12 | Generate Islamic Events for a Year | A user can generate all Islamic calendar events for a selected year or range of years. |
| UC-13 | View Events on Calendar | A user can view generated events on a monthly, weekly, or day calendar view. |
| UC-14 | View Event Details | A user can click on a calendar event to view its full details including name, date, and rich-text description. |
| UC-15 | Create Custom Event | An authenticated user can create a custom calendar event with a name, date, and rich-text description. |
| UC-16 | Edit Event | A user can edit the name, dates, color, and description of a calendar event. |
| UC-17 | Delete Event | A user can delete a specific calendar event. |
| UC-18 | Reset Islamic Events | A user can reset all auto-generated Islamic events back to their defaults. |
| UC-19 | Search Events | A user can search for events by name using a global search field. |

### Export and Subscription

| UC | Use Case | Description |
|----|----------|-------------|
| UC-20 | Download ICS File | A user can download a `.ics` file of their selected events to import into any calendar application. |
| UC-21 | Create Subscription URL | An authenticated user can generate a live subscription URL (webcal feed) that calendar applications can subscribe to for automatic updates. |
| UC-22 | Manage Subscription URLs | An authenticated user can view, rename, and revoke their subscription URLs. |
| UC-23 | Configure Subscription Event Selection | When creating a subscription URL, a user can select which event definitions to include in that specific feed. |

### Settings and Personalization

| UC | Use Case | Description |
|----|----------|-------------|
| UC-24 | Update Profile | An authenticated user can update their display name and language preference. |
| UC-25 | Manage Saved Locations | A user can save named locations (with latitude, longitude, and timezone) for use during event generation and export. |
| UC-26 | Set Default Location | A user can designate one of their saved locations as the default. |
| UC-27 | Toggle Arabic Event Text | A user can enable or disable the display of Arabic text alongside event names. |

### Offline and PWA

| UC | Use Case | Description |
|----|----------|-------------|
| UC-28 | Use App Offline | A user can use the application (view, generate, and customize events) without a network connection using local IndexedDB storage. |
| UC-29 | Sync Offline Data on Login | When an offline/unauthenticated user logs in, their locally cached events and preferences are automatically synced to the server. |
| UC-30 | Install as PWA | A user can install the application to their home screen as a Progressive Web App for a native app-like experience. |

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

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI component library |
| Vite | 7 | Build tool and development server |
| React Router | 7 | Client-side routing |
| MUI (Material UI) | 7 | Component library for consistent UI design |
| Emotion | 11 | CSS-in-JS styling engine used by MUI |
| Lexical | 0.41 | Rich text editor for event descriptions |
| Dexie.js | 4 | IndexedDB wrapper for offline storage |
| rrule | 2.8 | Recurrence rule parsing (RFC 5545) |
| DOMPurify | 3 | HTML sanitization for rendered rich text |
| Lucide React | 0.563 | Icon library |
| vite-plugin-pwa | 1.2 | Workbox-powered PWA and service worker generation |
| Day.js | 1.11 | Lightweight date manipulation library |

#### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22 | JavaScript runtime |
| Express.js | 4 | Web framework for the REST API |
| Passport.js | 0.7 | Authentication middleware |
| passport-google-oidc | 0.1 | Google OAuth 2.0 strategy |
| passport-microsoft | 2.1 | Microsoft OAuth 2.0 strategy *(implemented but routes currently inactive)* |
| passport-apple | 2.0 | Apple Sign In strategy *(implemented but routes currently inactive)* |
| passport-magic-link | 3.0 | Email magic-link strategy |
| passport-jwt | 4.0 | JWT-based authentication strategy |
| jsonwebtoken | 9.0 | JWT signing and verification |
| pg | 8 | PostgreSQL client |
| rrule | 2.8 | RFC 5545 recurrence rule expansion |
| sanitize-html | 2 | Server-side HTML sanitization |
| Winston | 3 | Structured logging |
| Resend | 6 | Transactional email delivery (magic links) |

#### Infrastructure

| Technology | Purpose |
|------------|---------|
| PostgreSQL 15 | Primary relational database |
| Redis | Caching layer |
| Nginx | Reverse proxy; routes `/api/*` to Express, all other paths to the React app |
| Docker / Docker Compose | Container orchestration for all five services |

### Docker Services

The application is fully containerized and defined in `compose.yml` (development) and `compose.prod.yml` (production). Five containers run together:

| Container | Image / Build | Role |
|-----------|--------------|------|
| `api_service` | Custom Node.js build (`api/Dockerfile`) | Express REST API on port 3000 (internal) |
| `react_app` | Custom Vite/Nginx build (`app/Dockerfile`) | Serves the compiled React SPA |
| `nginx_proxy` | `nginx:latest` | Reverse proxy on port 5000 (HTTP) and 443 (HTTPS); routes traffic to `api` or `app` |
| `ics_redis` | `redis:latest` | In-memory cache on port 6379 |
| `ics_postgres_db` | `postgres:15` | PostgreSQL database on port 5432; initialized with `Sql.Migrations/init.sql` |

Nginx routes requests as follows:
- `location /api` → `http://api:3000` (strips the `/api` prefix via rewrite)
- `location /` → `http://app/` (React SPA)

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

| Context | File | Responsibility |
|---------|------|----------------|
| `UserContext` | `contexts/UserContext.jsx` | Manages authentication state, login/logout, and sync-on-login flow |
| `CalendarContext` | `contexts/CalendarContext.jsx` | Manages events, definitions, and all CRUD operations with API-first / offline-fallback pattern |
| `ThemeContext` | `contexts/ThemeContext.jsx` | MUI theme management with light, dark, and green modes |

#### Layouts

| Layout | Route Scope | Purpose |
|--------|-------------|---------|
| `RootLayout` | All routes | Navbar, Footer, global providers |
| `MainLayout` | App pages | Main content wrapper |
| `CalendarLayout` | `/calendar` | Sidebar (Islamic Events Panel) + main calendar area |
| `AuthLayout` | `/auth/login`, `/auth/register` | Centered auth pages |

#### Core Pages

| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Landing page with upcoming Islamic days |
| Calendar | `/calendar` | Main calendar view (month/week/day) with event management |
| Export Events | `/export` | Download `.ics` file |
| Manage Subscriptions | `/subscriptions` | Create and manage subscription URLs |
| Settings | `/settings` | User profile, locations, preferences |
| Login / Register | `/auth/login`, `/auth/register` | Authentication flows |
| Guide | `/guide` | User guide for importing events |
| Learn | `/learn` | Educational content on the Islamic calendar |
| Features | `/features` | Overview of platform features |
| Methods | `/methods` | Explanation of Hijri calculation methods |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |
| Data Policy | `/data-policy` | Data handling policy |

#### Offline Architecture

The app implements an **API-first with offline fallback** pattern:

1. All data operations first attempt the REST API.
2. If the request fails due to a network error or a `401`/`403` auth error, the operation automatically retries against `OfflineClient`, which uses an IndexedDB database (via Dexie.js) named `IslamicCalendarSyncOffline`.
3. On the next successful login, `syncOfflineData()` in `UserContext` pushes cached IndexedDB data to the server via `POST /events/sync` and `POST /definitions/sync`, then clears the local cache.

The app is also a full **Progressive Web App (PWA)** using `vite-plugin-pwa` (Workbox). The service worker precaches all static assets (JS, CSS, HTML, fonts, images), enabling the app shell to load without a network connection. Runtime caching strategies are applied for navigation requests and Google Fonts.

#### Notable UI Components

The `components/` directory contains reusable components shared across pages. Several key components were added or significantly updated:

| Component | Purpose |
|-----------|---------|
| `Navbar.jsx` | `AppBar` with navigation links, `GlobalSearch`, `UserBadge`, mobile drawer, three-mode theme cycle (light / dark / green), and Web Share API integration |
| `Footer.jsx` | Multi-column footer (Product, Legal, Connect) with theme-aware styling via `data-lp-theme` |
| `UserBadge.jsx` | Avatar and dropdown menu for authenticated users (Settings, Sign out) |
| `GlobalSearch.jsx` | Popper-based event search with filter chips persisted to `localStorage`; input sanitized via DOMPurify |
| `LoginPromptModal.jsx` | Modal prompting unauthenticated users to continue with Google or email login |
| `SearchField.jsx` | Reusable search input that passes all values through DOMPurify before use |
| `RichTextEditor.jsx` | Lexical-based rich text editor with bold/italic/underline/strikethrough, lists, speech-to-text, markdown import/export, and read-only mode |
| `GoogleTranslateWidget.jsx` | Loads the Google Translate script for multilingual support; respects `user.language` when set |

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
│   │   ├── config.js            # Environment-based configuration
│   │   ├── passport.js          # Passport strategy configuration (Google, Microsoft, Apple, Magic Link, JWT)
│   │   ├── endpoints/           # Route handlers organized by resource
│   │   │   ├── events/          # CRUD for calendar events + ICS generation + offline sync
│   │   │   ├── definitions/     # Islamic definition preferences + offline sync
│   │   │   ├── subscription/    # Subscription token CRUD + live feed endpoint
│   │   │   ├── users/           # User CRUD and authentication
│   │   │   ├── user-locations/  # Saved location CRUD
│   │   │   ├── calendar-providers/  # Calendar provider management
│   │   │   ├── health/          # Health check endpoint
│   │   │   └── routes.js        # Central route registration
│   │   ├── middleware/
│   │   │   ├── AuthMiddleware.js        # JWT validation; attaches user to request; subscription token validation
│   │   │   ├── ErrorHandlerMiddleware.js # Global error handler
│   │   │   ├── NotFoundMiddleware.js    # 404 handler
│   │   │   ├── RateLimiter.js          # express-rate-limit + Redis; keyed by userId or IP
│   │   │   ├── RequestSanitizer.js     # Strips __proto__, constructor, prototype keys (prototype pollution defense)
│   │   │   ├── ResponseSanitizer.js    # Strips sensitive fields from responses
│   │   │   └── logger.js               # Winston-based structured logger
│   │   ├── model/
│   │   │   ├── db/DBConnection.js      # pg Pool connection
│   │   │   └── db/doa/                 # Data Object Access (DOA) layer — one file per table
│   │   ├── services/
│   │   │   ├── EventExpansionService.js # Expands recurring events (RRule) for a date range
│   │   │   ├── IcsBuilder.js           # Builds RFC 5545 iCalendar files
│   │   │   └── IslamicEventService.js  # Generates Islamic events from definitions + Hijri conversion
│   │   ├── util/
│   │   │   ├── hijriUtils.js           # Hijri ↔ Gregorian date conversion utilities
│   │   │   └── SanitizeHtml.js         # sanitize-html wrapper
│   │   ├── data/
│   │   │   └── islamicEvents.json      # Source-of-truth definitions for all Islamic events
│   │   └── constants.js
│   ├── jest.config.cjs
│   └── package.json
│
├── app/                         # React frontend
│   ├── src/
│   │   ├── main.jsx             # React entry point; service worker registration
│   │   ├── App.jsx              # Root component; router setup
│   │   ├── theme.js             # MUI theme definition
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
│   └── 001–005_*.sql            # Incremental schema migrations
│
├── _wiki/                       # Internal developer documentation
├── compose.yml                  # Docker Compose — development
├── compose.prod.yml             # Docker Compose — production
└── compose.test.yml             # Docker Compose — CI testing
```

### How It Works — User Perspective

1. **Landing Page** — The user arrives at the home page, which shows a preview of upcoming Islamic days and explains the platform.

2. **Calendar View** — The user navigates to the calendar. The Islamic Events Panel sidebar lists all available Islamic event definitions (Ramadan, Ashura, White Days of each month, Eid ul-Fitr, etc.). Each definition shows its name, a brief description, and a visibility toggle.

3. **Generate Events** — The user selects a year (or range of years) and clicks "Generate." The app calls the backend, which uses `IslamicEventService` and `hijriUtils` to convert Hijri dates to Gregorian dates and creates `Event` records in the database. The resulting events appear on the calendar.

4. **Event Details** — Clicking any event opens a modal showing the event's full rich-text description, including its Islamic significance, recommended practices, and any relevant supplications.

5. **Customization** — The user can edit an event's name, color, dates, or description. They can also hide definitions they do not want included in their calendar.

6. **Export** — On the Export page, the user chooses their calendar provider (Google Calendar, Apple Calendar, Outlook, Cal.com) and either downloads a `.ics` file to import once, or generates a subscription URL that they can add to their calendar application for live, automatically-updating events.

7. **Offline Mode** — All of the above works without an internet connection or without being logged in. Events and preferences are stored in IndexedDB. On the next login, data is automatically synced to the server.

### Key Backend Features

**Islamic Event Generation** — `IslamicEventService.js` reads event definitions from `islamicEvents.json`. Each definition specifies a Hijri month, Hijri day, duration, and recurrence type. `hijriUtils.js` performs the Hijri-to-Gregorian conversion using `Intl.DateTimeFormat` with the `islamic-umalqura` calendar, iterating each day of the requested Gregorian year to build a lookup map.

**ICS Builder** — `IcsBuilder.js` constructs a valid RFC 5545 iCalendar file from a set of event records. It handles all-day events, duration, timezone, and rich-text descriptions (HTML stripped to plain text for maximum compatibility).

**Subscription Feed** — `GetSubscriptionEvents.js` accepts a hashed token from the URL, validates it against the database, fetches the associated user's events (filtered to selected definitions), and returns a live `.ics` response. This endpoint is unauthenticated — the token itself is the credential.

**Authentication** — Two authentication strategies are currently active: **Google OAuth 2.0** (`passport-google-oidc`) and **Magic Link email** (`passport-magic-link`). Microsoft and Apple strategies are implemented in `passport.js` but their routes are inactive. On successful authentication, the server issues a signed JWT stored in an **httpOnly cookie** (`token`). The global `authenticateJwt` middleware (applied before all routes in `index.js`) decodes the cookie on every request and attaches `req.user` when a valid JWT is present; protected routes then use `Auth(role)` from `AuthMiddleware.js` to enforce authorization. The httpOnly cookie approach means the token is never accessible to JavaScript, reducing XSS risk.

**Response Sanitizer** — `ResponseSanitizer.js` middleware automatically removes sensitive fields (tokens, salts, passwords) from all API responses before they are sent to the client.

**Request Sanitizer** — `RequestSanitizer.js` middleware runs before route handlers and recursively removes prototype-pollution keys (`__proto__`, `constructor`, `prototype`) from `req.body`, `req.query`, and `req.params`. This prevents attackers from injecting properties into the JavaScript object prototype via incoming request data.

**Rate Limiter** — `RateLimiter.js` applies `express-rate-limit` backed by a **Redis** store to every API request. Authenticated requests are keyed by `userId`; unauthenticated requests are keyed by client IP. This limits the blast radius of brute-force and abuse attempts without requiring per-route configuration.

**Client-Side Input Sanitization** — On the frontend, all user-supplied HTML (event descriptions in `EventModal.jsx`) and search input (`SearchField.jsx`, `GlobalSearch.jsx`) is sanitized with **DOMPurify** before being rendered or used, preventing XSS in the browser.

---

## 6. Unit and System Testing

### Backend Unit Tests

The API has a comprehensive unit test suite written with **Jest**. Tests live alongside their source files under `api/src/`, following the `*.test.js` naming convention. The following areas are covered:

| Area | Test Files |
|------|-----------|
| Middleware | `AuthMiddleware.test.js`, `ErrorHandlerMiddleware.test.js`, `NotFoundMiddleware.test.js`, `RateLimiter.test.js`, `ResponseSanitizer.test.js` |
| Event Endpoints | `CreateEvent.test.js`, `GetEvents.test.js`, `GetEventById.test.js`, `UpdateEvent.test.js`, `DeleteEvent.test.js` |
| Definition Endpoints | `GetDefinitions.test.js`, `UpdateDefinitionPreference.test.js`, `SyncOfflinePreferences.test.js` |
| Subscription Endpoints | `GetSubscriptionEvents.test.js`, `GetSubscriptionUrls.test.js` |
| User Endpoints | `GetCurrentUser.test.js`, `UpdateCurrentUser.test.js`, `DeleteCurrentUser.test.js` |
| User Location Endpoints | `GetUserLocations.test.js`, `CreateUserLocation.test.js`, `UpdateUserLocation.test.js`, `DeleteUserLocation.test.js`, `SyncOfflineUserLocations.test.js` |
| Services | `IslamicEventService.test.js`, `EventExpansionService.test.js`, `IcsBuilder.test.js` |
| Utilities | `HijriUtils.test.js`, `SanitizeHtml.test.js` |
| Health | `Health.test.js` |

Tests are run with coverage reporting:

```bash
cd api
npm run test:coverage
```

**Test Count**

- **29 test suites**, all passing
- **113 individual tests**, all passing

**Coverage Summary**

| Area | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **All files** | **87.70%** | **72.97%** | **88.37%** | **87.70%** |
| Middleware | 66.31% | 73.84% | 68.75% | 66.31% |
| Services | 95.49% | 72.26% | 100% | 95.49% |
| Utilities | 100% | 73.33% | 100% | 100% |

**Highlights:**

- `SanitizeHtml.js`, `NotFoundMiddleware.js`, and `RateLimiter.js` — **100% statement/line coverage**
- `IcsBuilder.js` and `hijriUtils.js` — **100% statement/line coverage**
- `RateLimiter.js` — **100% statements and branches**; 50% function coverage (the Redis-store factory path is not exercised in unit tests)
- `RequestSanitizer.js` — **0% coverage**; no test file exists yet — the clearest gap to address next
- The main gaps in `AuthMiddleware.js` (lines 61–163, the Google OAuth redirect and subscription-token verification paths) are harder to unit test in isolation without live Passport sessions
- Branch coverage at **72.97%** is the weakest metric overall — mostly untested edge-case branches in `hijriUtils.js`, `IcsBuilder.js`, and the services

Overall, **113 passing tests across 29 suites** is a solid result for a backend of this size. The most actionable improvement would be adding a test file for `RequestSanitizer.js` and a few branch-level tests in `ErrorHandlerMiddleware.js`.

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

2. **Create the environment file.** Copy the template below to a file named `.env` in the project root:
   ```bash
   # Application
   APP_BASE_URL=http://localhost:5000
   NODE_ENV=development

   # Google OAuth
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/redirect

   # JWT
   JWT_SECRET=your-long-random-secret   # generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Database
   DB_HOST=database
   POSTGRES_USER=postgres_user
   POSTGRES_PASSWORD=your-db-password
   POSTGRES_DB=ics_development
   DB_PORT=5432

   # API
   API_PORT=3000

   # Email (for magic link login)
   RESEND_API_KEY=your-resend-api-key
   EMAIL_FROM=noreply@yourdomain.com
   ```

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

### Production Deployment

The following steps describe deploying to a Linux VPS (e.g., Contabo).

#### 1. Reserve a Domain

Register a domain name with a registrar of your choice (e.g., Namecheap, Google Domains). Point the domain's DNS A record to your VPS IP address.

#### 2. Provision a VPS

Create a VPS running Ubuntu 22.04 LTS. Ensure Docker and Docker Compose are installed:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install docker.io docker-compose-plugin -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER  # allow running docker without sudo (re-login required)
```

#### 3. SSH Into the VPS

```bash
ssh user@your-server-ip
```

#### 4. Clone the Repository and Configure

```bash
git clone <repository-url>
cd IslamicCalendarSync
cp .env.prod.example .env.prod  # or create .env.prod manually
```

Edit `.env.prod` with production values: your domain's OAuth callback URLs, a strong `JWT_SECRET`, production database credentials, and your Resend API key.

#### 5. Configure Google Cloud Console for Production

Google OAuth will reject login attempts if the production domain is not registered in the Cloud Console. Update your OAuth 2.0 credentials **before** starting the containers.

1. Open [Google Cloud Console](https://console.cloud.google.com/) and navigate to **APIs & Services > Credentials**.
2. Select the OAuth 2.0 Client ID used by the application.
3. Under **Authorized JavaScript origins**, add your production domain:
   ```
   https://yourdomain.com
   ```
4. Under **Authorized redirect URIs**, add the production callback URL:
   ```
   https://yourdomain.com/api/auth/google/redirect
   ```
5. Click **Save**.
6. Update `.env.prod` with the production OAuth values and callback URL:
   ```bash
   GOOGLE_CLIENT_ID=your-production-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-production-client-secret
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/redirect
   APP_BASE_URL=https://yourdomain.com
   ```

> **Note:** The value of `GOOGLE_CALLBACK_URL` in `.env.prod` must match the registered redirect URI in Google Cloud Console **exactly** — including scheme (`https://`), host, and path. A mismatch will produce `Error 400: redirect_uri_mismatch` when users attempt to log in.

If your app is still in **Testing** mode on the OAuth consent screen, add each production Google account as a **Test user** under **APIs & Services > OAuth consent screen**, or publish the app to allow all Google accounts to authenticate.

#### 6. Set Up SSL Certificates (HTTPS)

Install Certbot and obtain a certificate for your domain:

```bash
sudo apt install certbot -y
sudo certbot certonly --standalone -d yourdomain.com
```

Certificates are stored in `/etc/letsencrypt/live/yourdomain.com/`. Update `proxy/nginx.conf` to add HTTPS configuration and mount the certificate volumes into the `proxy` service in `compose.prod.yml`.

#### 7. Build and Start Production Services

```bash
docker compose -f compose.prod.yml up --build -d
```

The `-d` flag runs the containers in the background. The application will be accessible at `https://yourdomain.com`.

#### 8. Run Schema Migrations

For subsequent deployments, run any new migration scripts:

```bash
docker exec api_service_prod node scripts/runMigrations.js up
```

#### 9. Manage Services

```bash
docker compose -f compose.prod.yml logs -f         # tail logs
docker compose -f compose.prod.yml restart api     # restart a single service
docker compose -f compose.prod.yml down            # stop all services
```

---

## 8. Reflection

### Experience

Working on Islamic Calendar Sync over the course of this semester was one of the most valuable learning experiences I have had. It gave me the opportunity to build a full-stack product from the ground up, making real architectural decisions and seeing how all the pieces of a modern web application fit together.

I learned an enormous amount about Docker and containerization — not just how to write a `Dockerfile`, but how to orchestrate multiple services together, manage inter-container networking, handle persistent volumes, and think through the difference between a development and production environment. Before this project, Docker was something I had used minimally; by the end, I could debug container issues, manage logs, and deploy a multi-service application to a VPS confidently.

I also deepened my understanding of middleware, structured logging, and what it means to build a project with a solid architecture. Implementing proper authentication — with JWT stored in httpOnly cookies, magic-link emails, and multiple OAuth provider strategies — taught me that security is not something you bolt on at the end. Each security layer added value independently: the `ResponseSanitizer` scrubs sensitive fields from every API response; the `RequestSanitizer` blocks prototype-pollution attacks before any route handler runs; the rate limiter using Redis throttles abuse at the edge; the `MagicLinkUsedToken` table makes one-time login links truly one-time; and salted PBKDF2 hashing secures the subscription feed tokens. Seeing these pieces fit together as a coherent defense-in-depth strategy — rather than a checklist of bolt-ons — was one of the most instructive parts of the project. On the frontend, the same discipline applied: DOMPurify sanitizes all user-supplied HTML on the client before it is rendered, and the httpOnly cookie approach keeps the JWT entirely out of reach of JavaScript, reducing XSS risk.

Another significant technical achievement was the offline-first PWA architecture. Learning about IndexedDB, Dexie.js, service workers, Workbox, and how to design a seamless API-first-with-offline-fallback pattern — and then seeing it actually work, where a user can generate and edit events while offline and have them sync when they log back in — was particularly satisfying.

### Scope Changes and What I Learned

The original project proposal included the ability for users to configure and export their daily prayer times (Fajr, Dhuhr, Asr, etc.) into their calendar. This was a significant part of the initial vision. However, as development progressed, I made the deliberate decision to remove prayer time configuration from the scope for this semester. The database schema and models still contain the commented-out scaffolding (`Prayer`, `PrayerType`, `PrayerConfiguration`), but the feature was not implemented.

The reason was focus: with a fixed deadline, implementing the most important and distinctive part of the project — the Islamic calendar event sync with rich, meaningful descriptions — was the right priority. Prayer time calculation is a well-solved problem with existing apps; the core value of Islamic Calendar Sync is the event descriptions and the sync mechanism. By cutting prayers, I was able to deliver a complete, working, and well-tested version of the core feature set.

Another significant change from the initial proposal was the **calendar integration strategy**. The original plan was to use each calendar provider's API (e.g., the Google Calendar API) to directly add events to the user's calendar on their behalf. After research and feedback, I realized this approach would require pushing potentially hundreds of events per user, would involve complex token management for each provider, and would create ongoing API cost and rate-limit concerns. The simpler and more robust solution — generating a standard `.ics` file or a live subscription URL that the user's calendar app consumes natively — achieves the same end result with far less complexity and no ongoing API dependency. This was one of the most important "consult others and consider simpler approaches" moments of the project.

These scope decisions reflect a core lesson of the semester: **when building a project with limited time, disciplined scope management is not a failure — it is what makes it possible to ship something that works well.** A smaller feature set built solidly is far more valuable than a larger feature set built partially.

---

*Islamic Calendar Sync — Spring 2026*
