# Offline & PWA Guide

This document explains how the app handles **offline usage** and **API failures** by automatically falling back to **IndexedDB** for local caching, and how that data is synced to the PostgreSQL backend when the user signs in. It also covers the **Progressive Web App (PWA)** shell caching strategy that allows the app to load without a network connection.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow — API-First with Offline Fallback](#data-flow--api-first-with-offline-fallback)
3. [Error Classification (ApiErrorHelper)](#error-classification-apierrorhelper)
4. [IndexedDB Schema (Dexie)](#indexeddb-schema-dexie)
5. [OfflineClient — IndexedDB CRUD](#offlineclient--indexeddb-crud)
6. [Client-Side Islamic Event Generation](#client-side-islamic-event-generation)
7. [CalendarContext — API-First Pattern](#calendarcontext--api-first-pattern)
8. [Sync-on-Login Flow](#sync-on-login-flow)
9. [Backend Sync Endpoints](#backend-sync-endpoints)
10. [PWA & Service Worker Caching](#pwa--service-worker-caching)
11. [File Inventory](#file-inventory)
12. [Testing & Debugging](#testing--debugging)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│                                                                 │
│  CalendarContext  ──── APIClient ──┬── success → use response   │
│                                   └── fail? ─┐                 │
│                      shouldFallbackToOffline? │                 │
│                            yes ──► OfflineClient (IndexedDB)   │
│                             no ──► throw error to UI            │
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

The frontend uses a single **API-first** strategy. Every operation targets the REST API first. If the request fails due to a **network error** (offline) or an **authentication error** (401/403), the operation automatically falls back to **IndexedDB via OfflineClient**. Data cached in IndexedDB is synced to the server on the next successful login.

| Scenario | Primary | Fallback |
|---|---|---|
| **Online + authenticated** | APIClient (REST API → PostgreSQL) | — |
| **Offline (network failure)** | APIClient fails | OfflineClient (IndexedDB) |
| **Unauthenticated (401/403)** | APIClient fails | OfflineClient (IndexedDB) |

---

## Data Flow — API-First with Offline Fallback

### Normal Flow (Online + Authenticated)

1. User logs in via Google OAuth or email verification.
2. `UserContext` calls `syncOfflineData()` which checks IndexedDB for any cached data from a previous offline session.
3. If cached data exists, it is POSTed to `/events/sync` and `/definitions/sync`, then IndexedDB is cleared.
4. `CalendarContext` loads events and definitions from `APIClient`. All CRUD operations go through the API.

### Offline / Unauthenticated Fallback Flow

1. User performs an action (create event, toggle definition, etc.).
2. `CalendarContext` calls `APIClient.someMethod()`.
3. The request fails — either a `TypeError` (network failure) or a 401/403 HTTP error.
4. `shouldFallbackToOffline(err)` returns `true`.
5. The same operation is retried against `OfflineClient`, which persists data in IndexedDB.
6. The UI updates normally — the user doesn't see a difference.
7. On the next successful login, `syncOfflineData()` pushes all cached IndexedDB data to the server.

### On Mount (Initial Load)

- **Authenticated user:** Load from API; if API fails with offline/auth error, fall back to IndexedDB.
- **Unauthenticated user:** Check if IndexedDB has cached data from a previous offline session. If yes, display it. If no, show empty state with login prompt.

---

## Error Classification (ApiErrorHelper)

**File:** `app/src/util/ApiErrorHelper.js`

A helper module that classifies API errors to determine whether an operation should fall back to IndexedDB.

### Functions

| Function | Returns `true` when |
|---|---|
| `isOfflineError(err)` | `!navigator.onLine` or `err` is a `TypeError` (fetch network failure) |
| `isAuthError(err)` | `err.status === 401` or `err.status === 403` |
| `shouldFallbackToOffline(err)` | Either `isOfflineError` or `isAuthError` is true |

### How It Works

`HttpClient.handleResponse()` attaches the HTTP status code to thrown errors (`err.status`). Network-level fetch failures throw a `TypeError` naturally. `shouldFallbackToOffline` checks both cases:

```js
// In CalendarContext CRUD functions:
try {
  res = await APIClient.createEvent(eventData);
} catch (err) {
  if (shouldFallbackToOffline(err)) {
    res = await OfflineClient.createEvent(eventData);
  } else {
    throw err;
  }
}
```

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

`OfflineClient` is a static class whose methods mirror `APIClient` so that `CalendarContext` can fall back to it seamlessly when the API is unreachable.

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

## CalendarContext — API-First Pattern

**File:** `app/src/contexts/CalendarContext.jsx`

The calendar context always targets the API first. If the request fails and the error is classified as an offline or auth error, the operation falls back to OfflineClient.

### Auth Check

```js
const isAuth = !!user?.userId;
```

### CRUD Pattern

Every function follows the same try-API-then-fallback pattern:

```js
async function addEvent(eventData) {
  let res;
  try {
    res = await APIClient.createEvent(eventData);
  } catch (err) {
    if (shouldFallbackToOffline(err)) {
      res = await OfflineClient.createEvent(eventData);
    } else {
      throw err;
    }
  }
  // update local state with res...
}
```

### Main Data-Loading Effect

The `useEffect` that runs on mount (and when `user?.userId` changes):

- **Authenticated:** Calls `APIClient.getEvents()` and `APIClient.getDefinitions()`. On failure with offline/auth error, falls back to `OfflineClient`. Also fetches `APIClient.getCalendarProviders()` in the background.
- **Unauthenticated:** Checks `OfflineClient.hasData()`. If IndexedDB has cached data, loads it so returning users see their events. Otherwise shows empty state.

### Islamic Event Generation

`ensureIslamicEventsForYearInternal(year)` is called when the user navigates to a new year:

- Tries `APIClient.generateEvents(year)` first.
- On offline/auth failure, falls back to `OfflineClient.generateEvents(year)` (client-side generation).
- Merges newly generated events into existing state using `islamicEventKey` deduplication.

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
  └─ OfflineClient.clearAll()  → truncate IndexedDB
```

This function is called in two places:

1. **On mount** — After `getCurrentUser()` returns a valid user (covers the OAuth redirect flow where the user returns with a `#token=...` hash).
2. **On `login()` callback** — Called by the email login flow after receiving valid user data.

### Error Handling

If the sync fails (network error, server error), the error is logged but does **not** block the login. The user's IndexedDB data is preserved (not cleared) so that sync can be retried on the next page load.

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
*.js, *.css, *.html, *.woff2, *.png, *.svg, *.ico
```

This means the app's HTML, JavaScript bundles, CSS, web fonts, and images are available offline after the first visit.

### Runtime Caching

| Pattern | Strategy | Purpose |
|---|---|---|
| Navigation requests | NetworkFirst (3s timeout) | HTML pages — try network, fall back to cache |
| Google Fonts stylesheets (`fonts.googleapis.com`) | CacheFirst (30 days, max 30 entries) | Font CSS — use cache, only fetch if missing |
| Google Fonts webfonts (`fonts.gstatic.com`) | CacheFirst (30 days, max 30 entries) | Font files — use cache, only fetch if missing |

### Web App Manifest

The manifest enables "Add to Home Screen" on mobile devices:

| Property | Value |
|---|---|
| `name` | Islamic Calendar Sync |
| `short_name` | ICS |
| `description` | Sync your Islamic calendar events across devices |
| `theme_color` | `#1b5e20` (dark green) |
| `background_color` | `#ffffff` |
| `display` | `standalone` |
| `start_url` | `/` |
| `icons` | `/pwa-192x192.png` (192×192), `/pwa-512x512.png` (512×512, maskable) |

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

### Files

| File | Purpose |
|---|---|
| `app/src/util/OfflineDb.js` | Dexie database instance and schema definition |
| `app/src/util/OfflineClient.js` | Static CRUD class backed by IndexedDB (fallback layer) |
| `app/src/util/ApiErrorHelper.js` | Error classification — `isOfflineError`, `isAuthError`, `shouldFallbackToOffline` |
| `app/src/util/HttpClient.js` | HTTP client — attaches `err.status` to thrown errors for classification |
| `app/src/util/ApiClient.js` | REST API client — primary data layer |
| `app/src/services/IslamicEventService.js` | Client-side Islamic event generation algorithm |
| `app/src/data/islamicEvents.json` | Bundled Islamic event definitions (copy of backend) |
| `app/src/contexts/CalendarContext.jsx` | API-first calendar state with offline fallback |
| `app/src/contexts/UserContext.jsx` | User session management and sync-on-login |
| `app/vite.config.js` | VitePWA plugin configuration (manifest + workbox) |
| `app/src/main.jsx` | Service worker registration |
| `api/src/endpoints/events/SyncOfflineEvents.js` | Bulk event sync endpoint |
| `api/src/endpoints/definitions/SyncOfflinePreferences.js` | Bulk definition preference sync endpoint |

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
3. Check the **Cache Storage** section — you should see Workbox-managed caches with your app's JS/CSS/HTML files.
4. Toggle **Offline** mode in the Network tab and refresh — the app shell should still load.

### Verifying the Manifest

1. Open Chrome DevTools → **Application** → **Manifest**.
2. You should see the app name ("Islamic Calendar Sync"), theme color, icons, and display mode.
3. If the manifest section is empty, ensure you've done a production build (`npm run build`). In dev mode, `vite-plugin-pwa` may not generate the manifest by default.

### Testing Offline Fallback

1. Log in and verify events load from the API.
2. Toggle **Offline** mode in DevTools → Network tab.
3. Create a new event — it should succeed (cached in IndexedDB).
4. Toggle definitions — preferences should persist in IndexedDB.
5. Go back online and refresh — the app should load from the API again.
6. Log out and log back in — `syncOfflineData()` should push cached data to the server.

### Testing Unauthenticated Fallback

1. Open the app without logging in. If there's no cached IndexedDB data, you'll see an empty calendar with a login prompt.
2. Open DevTools → Console and manually call `OfflineClient.createEvent(...)` to seed IndexedDB.
3. Refresh — the app should load cached events from IndexedDB even without authentication.

### Testing Sync on Login

1. While offline or unauthenticated, create events and toggle definitions (they get cached in IndexedDB).
2. Go online and log in.
3. After login, check that:
   - IndexedDB tables are empty (data was cleared after sync).
   - The events and preferences appear in the backend (check via the API or the calendar UI).

### Common Issues

| Issue | Solution |
|---|---|
| Service worker not registering in dev | `vite-plugin-pwa` only generates the SW in production builds by default. Run `npm run build && npm run preview` to test. |
| Manifest not showing in DevTools | Same as above — the manifest is generated at build time, not in dev mode. |
| IndexedDB data not syncing on login | Check the browser console for errors from `syncOfflineData()`. Ensure the JWT is set before the sync request fires. |
| Duplicate Islamic events after sync | The backend uses `islamicEventKey` partial unique index for deduplication. Ensure events have this field set. |
| PWA install prompt not showing | Ensure the manifest icons exist at `app/public/pwa-192x192.png` and `app/public/pwa-512x512.png`. |
| API error not falling back to IndexedDB | Ensure `HttpClient.handleResponse()` attaches `err.status` to thrown errors. Check that `shouldFallbackToOffline(err)` returns `true` for the error. |
