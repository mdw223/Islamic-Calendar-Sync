# Offline & PWA Guide

This document explains how **unauthenticated (guest) users** can create, edit, and delete calendar events entirely offline using **IndexedDB**, and how that data is automatically synced to the PostgreSQL backend when the user signs in. It also covers the **Progressive Web App (PWA)** shell caching strategy that allows the app to load without a network connection.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow — Guest vs Authenticated](#data-flow--guest-vs-authenticated)
3. [IndexedDB Schema (Dexie)](#indexeddb-schema-dexie)
4. [OfflineClient — IndexedDB CRUD](#offlineclient--indexeddb-crud)
5. [Client-Side Islamic Event Generation](#client-side-islamic-event-generation)
6. [Dual-Mode CalendarContext](#dual-mode-calendarcontext)
7. [Sync-on-Login Flow](#sync-on-login-flow)
8. [Backend Sync Endpoints](#backend-sync-endpoints)
9. [PWA & Service Worker Caching](#pwa--service-worker-caching)
10. [File Inventory](#file-inventory)
11. [Testing & Debugging](#testing--debugging)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│                                                                 │
│  CalendarContext  ──── isGuest? ──┬── OfflineClient (IndexedDB) │
│                                  └── APIClient   (REST API)    │
│                                                                 │
│  UserContext  ── on login ── syncOfflineData() ── APIClient     │
│                                                                 │
│  Service Worker (Workbox)  ── caches shell assets               │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Express API                              │
│                                                                 │
│  POST /events/sync         ── bulk upsert events                │
│  POST /definitions/sync    ── bulk upsert definition prefs      │
│  (all existing CRUD routes unchanged)                           │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
                    ┌────────────┐
                    │ PostgreSQL │
                    └────────────┘
```

The frontend has two data "backends":

| Mode | Storage | Trigger |
|---|---|---|
| **Guest (offline)** | IndexedDB via Dexie.js | User clicks "Continue as Guest" (`startOfflineGuestSession`) |
| **Authenticated** | PostgreSQL via REST API | User logs in (OAuth or email) |

When a guest later logs in, any data in IndexedDB is pushed to the backend in a single sync request, then the local database is cleared.

---

## Data Flow — Guest vs Authenticated

### Guest Flow

1. User opens the app without logging in and clicks **Continue as Guest**.
2. `UserContext` sets `localStorage[OFFLINE_GUEST_KEY] = "1"` and marks the user model as `isOfflineGuest: true`.
3. `CalendarContext` detects `isGuest` and routes all CRUD calls through `OfflineClient` instead of `APIClient`.
4. Events and definition preferences are stored in IndexedDB (Dexie).
5. Islamic events for any requested year are generated **client-side** (no API call needed).

### Authenticated Flow

1. User logs in via Google OAuth or email verification.
2. `UserContext` calls `syncOfflineData()` which checks IndexedDB for any guest data.
3. If guest data exists, it is POSTed to `/events/sync` and `/definitions/sync`.
4. IndexedDB is cleared and the `OFFLINE_GUEST_KEY` is removed from `localStorage`.
5. `CalendarContext` routes all CRUD calls through `APIClient` as normal.

---

## IndexedDB Schema (Dexie)

**File:** `app/src/util/OfflineDb.js`

The database is named `IslamicCalendarSyncOffline` and uses Dexie.js v4.

### Tables

#### `events`

| Column | Index | Description |
|---|---|---|
| `id` | Auto-increment PK (`++id`) | Local-only identifier |
| `islamicEventKey` | Indexed | Deduplication key for generated Islamic events (e.g. `"1446-1-1"`) |
| `islamicDefinitionId` | Indexed | References the definition that generated this event |
| `eventTypeId` | Indexed | 1 = Islamic, 2 = Custom |
| `name` | — | Event title |
| `startDate` | — | ISO date string |
| `endDate` | — | ISO date string |
| `description` | — | Optional rich-text HTML |
| `allDay` | — | Boolean |
| `isHidden` | — | Whether the event is hidden via definition toggle |

#### `definitionPreferences`

| Column | Index | Description |
|---|---|---|
| `definitionId` | Primary key | The Islamic definition ID |
| `isHidden` | — | Whether the user has hidden this definition |

---

## OfflineClient — IndexedDB CRUD

**File:** `app/src/util/OfflineClient.js`

`OfflineClient` is a static class whose methods mirror `APIClient` so that `CalendarContext` can swap between them seamlessly.

### Key Methods

| Method | Description |
|---|---|
| `getEvents()` | Returns all events from Dexie, wrapped in `{ success, events }` |
| `getEventById(id)` | Returns a single event by Dexie auto-increment `id` |
| `createEvent(data)` | Inserts a new event, returns `{ success, event }` |
| `updateEvent(id, updates)` | Updates an event in-place |
| `deleteEvent(id)` | Deletes an event by `id` |
| `generateEvents(year)` | Delegates to `IslamicEventService.generateForOfflineUser(year)` |
| `getDefinitions()` | Returns merged definitions (base JSON + user preferences) |
| `updateDefinitionPreference(defId, isHidden)` | Saves preference to `definitionPreferences` table and updates matching events' `isHidden` flag |
| `getAllDataForSync()` | Returns `{ events, preferences }` with local IDs stripped — ready for backend import |
| `clearAll()` | Truncates both Dexie tables |
| `hasData()` | Returns `true` if either table has rows |

---

## Client-Side Islamic Event Generation

**File:** `app/src/services/IslamicEventService.js`

This is a client-side port of the backend's `api/src/util/HijriUtils.js` and `api/src/services/IslamicEventService.js`. It generates Islamic calendar events for any Gregorian year without requiring a network request.

### How It Works

1. **`getBaseDefinitions()`** — Loads event definitions from the bundled JSON file (`app/src/data/islamicEvents.json`). This JSON contains 27 definitions including annual events (Islamic New Year, Ashura, Eid ul-Fitr, etc.), monthly recurring events (White Days), and month-start markers.

2. **`getMergedDefinitions()`** — Merges the base definitions with any user preferences stored in Dexie's `definitionPreferences` table (for `isHidden` overrides).

3. **`generateIslamicEventsForYear(gregorianYear, definitions)`** — The core algorithm:
   - Iterates each day of the Gregorian year (Jan 1 → Dec 31).
   - Converts each Gregorian date to a Hijri date using `Intl.DateTimeFormat` with the `islamic-umalqura` calendar.
   - Builds a lookup map of `hijriMonth-hijriDay` → Gregorian date.
   - Matches each definition's `hijriMonth` and `hijriDay` against the map to find the corresponding Gregorian date.
   - Handles multi-day events via `durationDays`.
   - Handles monthly recurring events (definitions with `isMonthly: true`).
   - Returns an array of event objects with `islamicEventKey` for deduplication.

4. **`generateForOfflineUser(year)`** — Orchestrates the full flow: gets merged definitions, generates events, then upserts into Dexie with deduplication on `islamicEventKey`.

### Bundled Data

**File:** `app/src/data/islamicEvents.json`

This is an exact copy of `api/src/data/islamicEvents.json`. It is bundled into the frontend build so that event generation works offline. If the backend's definitions change, this file must be updated to match.

---

## Dual-Mode CalendarContext

**File:** `app/src/contexts/CalendarContext.jsx`

The calendar context uses two derived booleans to decide which client to use:

```js
const isGuest = user?.isOfflineGuest === true;
const isAuth  = !!user?.userId;
```

Every CRUD function follows the same pattern:

```js
const client = isGuest ? OfflineClient : APIClient;
const result = await client.someMethod(...);
```

### ID Field Handling

Dexie uses an auto-increment `id` field, while PostgreSQL uses `eventId`. The context normalises this:

```js
const idField = isGuest ? "id" : "eventId";
const eventId = event[idField];
```

### Main Data-Loading Effect

The `useEffect` that runs on mount (and when `isGuest` changes) branches:

- **Guest:** Calls `OfflineClient.getEvents()` and `OfflineClient.getDefinitions()`.
- **Auth:** Calls `APIClient.getEvents()`, `APIClient.getDefinitions()`, and `APIClient.getCalendarProviders()`.

Calendar providers (Google Calendar integration) are only fetched for authenticated users, since they require OAuth tokens.

### Islamic Event Generation

`ensureIslamicEventsForYearInternal(year)` is called when the user navigates to a new year:

- **Guest:** Calls `OfflineClient.generateEvents(year)`, then replaces the event state with _all_ events from IndexedDB (since generation may add new ones).
- **Auth:** Calls `APIClient.generateEvents(year)`, then merges any newly generated events into the existing state.

---

## Sync-on-Login Flow

**File:** `app/src/contexts/UserContext.jsx`

The sync logic lives in a `syncOfflineData()` helper inside `UserProvider`:

```
syncOfflineData()
  ├─ OfflineClient.hasData()  → false? return (nothing to sync)
  ├─ OfflineClient.getAllDataForSync()  → { events, preferences }
  ├─ APIClient.syncOfflineEvents(events)     → POST /events/sync
  ├─ APIClient.syncOfflinePreferences(prefs) → POST /definitions/sync
  ├─ OfflineClient.clearAll()  → truncate IndexedDB
  └─ localStorage.removeItem(OFFLINE_GUEST_KEY)
```

This function is called in two places:

1. **On mount** — After `getCurrentUser()` returns a valid user (covers the OAuth redirect flow where the user returns with a `#token=...` hash).
2. **On `login()` callback** — Called by the email login flow after receiving valid user data.

### Error Handling

If the sync fails (network error, server error), the error is logged but does **not** block the login. The user's IndexedDB data is preserved (not cleared) so that sync can be retried on the next page load. The `OFFLINE_GUEST_KEY` is always removed in the `finally` block to prevent the user from being stuck in guest mode.

---

## Backend Sync Endpoints

### POST `/events/sync`

**File:** `api/src/endpoints/events/SyncOfflineEvents.js`

- **Auth:** Requires a valid JWT (`AuthUser.VALID_USER`).
- **Body:** `{ events: [...] }` — array of event objects.
- **Validation:** Max 2000 events; each must have `name`, `startDate`, `endDate`, and `eventTypeId`.
- **Logic:** Calls `EventDOA.bulkUpsert(events, userId)` which uses the existing bulk-insert mechanism with conflict handling on `islamicEventKey`.
- **Response:** `{ success: true, syncedCount: N }`

### POST `/definitions/sync`

**File:** `api/src/endpoints/definitions/SyncOfflinePreferences.js`

- **Auth:** Requires a valid JWT (`AuthUser.VALID_USER`).
- **Body:** `{ preferences: [...] }` — array of `{ definitionId, isHidden }` objects.
- **Validation:** Max 200 preferences; each must have `definitionId` (number) and `isHidden` (boolean).
- **Logic:** Iterates through preferences, calling `IslamicDefinitionPreferenceDOA.upsertPreference()` and `EventDOA.updateHideByDefinitionId()` for each.
- **Response:** `{ success: true, syncedCount: N }`

### Route Registration

**File:** `api/src/endpoints/Routes.js`

```js
router.post("/events/sync", Auth(AuthUser.VALID_USER), SyncOfflineEvents);
router.post("/definitions/sync", Auth(AuthUser.VALID_USER), SyncOfflinePreferences);
```

---

## PWA & Service Worker Caching

### Configuration

**File:** `app/vite.config.js`

The app uses `vite-plugin-pwa` with Workbox's `generateSW` strategy. This auto-generates a service worker at build time.

### Precaching (Shell Assets)

The service worker precaches all static assets matching:

```
*.js, *.css, *.html, *.woff2
```

This means the app's HTML, JavaScript bundles, CSS, and web fonts are available offline after the first visit. Users can browse cached pages without a network connection.

### Runtime Caching

| Pattern | Strategy | Purpose |
|---|---|---|
| Navigation requests | NetworkFirst | HTML pages — try network, fall back to cache |
| Google Fonts CDN (`fonts.googleapis.com`, `fonts.gstatic.com`) | CacheFirst (30 days, max 30 entries) | Font files — use cache, only fetch if missing |

### Web App Manifest

The manifest enables "Add to Home Screen" on mobile devices:

| Property | Value |
|---|---|
| `name` | Islamic Calendar Sync |
| `short_name` | ICS |
| `theme_color` | `#1b5e20` (dark green) |
| `background_color` | `#ffffff` |
| `display` | `standalone` |
| `icons` | `/pwa-192x192.png`, `/pwa-512x512.png` |

> **Note:** The icon files (`app/public/pwa-192x192.png` and `app/public/pwa-512x512.png`) must be created manually. Without them, the PWA install prompt will still work on most browsers but will lack an icon.

### Service Worker Registration

**File:** `app/src/main.jsx`

```js
import { registerSW } from "virtual:pwa-register";
registerSW({ immediate: true });
```

The `immediate: true` option registers and activates the service worker as soon as the app loads, without waiting for the user to revisit.

---

## File Inventory

### New Files

| File | Purpose |
|---|---|
| `app/src/util/OfflineDb.js` | Dexie database instance and schema definition |
| `app/src/util/OfflineClient.js` | Static CRUD class backed by IndexedDB |
| `app/src/services/IslamicEventService.js` | Client-side Islamic event generation algorithm |
| `app/src/data/islamicEvents.json` | Bundled Islamic event definitions (copy of backend) |
| `api/src/endpoints/events/SyncOfflineEvents.js` | Bulk event sync endpoint |
| `api/src/endpoints/definitions/SyncOfflinePreferences.js` | Bulk definition preference sync endpoint |

### Modified Files

| File | Changes |
|---|---|
| `app/vite.config.js` | Added `VitePWA` plugin configuration |
| `app/src/main.jsx` | Added service worker registration |
| `app/src/contexts/CalendarContext.jsx` | Dual-mode routing (OfflineClient vs APIClient) |
| `app/src/contexts/UserContext.jsx` | `syncOfflineData()` helper and sync-on-login logic |
| `app/src/util/ApiClient.js` | Added `syncOfflineEvents()` and `syncOfflinePreferences()` |
| `api/src/endpoints/Routes.js` | Registered sync routes |

---

## Testing & Debugging

### Verifying IndexedDB Data

1. Open Chrome DevTools → **Application** → **IndexedDB**.
2. Look for the database named `IslamicCalendarSyncOffline`.
3. Expand to see the `events` and `definitionPreferences` tables.
4. You can inspect, edit, or delete entries directly.

### Verifying the Service Worker

1. Open Chrome DevTools → **Application** → **Service Workers**.
2. You should see a registered service worker from `sw.js`.
3. Check the **Cache Storage** section, you should see Workbox-managed caches with your app's JS/CSS/HTML files.
4. Toggle **Offline** mode in the Network tab and refresh — the app shell should still load.

### Testing the Guest → Login Sync

1. Open the app without logging in and click **Continue as Guest**.
2. Create a few events and toggle some Islamic definitions.
3. Verify data appears in IndexedDB (Application → IndexedDB).
4. Log in via Google OAuth or email.
5. After login, check that:
   - IndexedDB tables are empty (data was cleared).
   - The events and preferences appear in the backend (check via the API or the calendar UI).
   - `localStorage` no longer has the `OFFLINE_GUEST_KEY`.

### Testing Offline Shell Caching

1. Visit the app once while online (to populate the cache).
2. Disconnect from the network (or use DevTools offline toggle).
3. Navigate to different pages — they should load from the service worker cache.
4. Note: API calls will fail, but the page structure and navigation should work.

### Common Issues

| Issue | Solution |
|---|---|
| Service worker not registering in dev | `vite-plugin-pwa` only generates the SW in production builds by default. Run `npm run build && npm run preview` to test. |
| IndexedDB data not syncing | Check the browser console for errors from `syncOfflineData()`. Ensure the JWT is set before the sync request fires. |
| Duplicate Islamic events after sync | The backend uses `islamicEventKey` partial unique index for deduplication. Ensure events have this field set. |
| PWA install prompt not showing | Ensure the manifest icons exist at `app/public/pwa-192x192.png` and `app/public/pwa-512x512.png`. |
