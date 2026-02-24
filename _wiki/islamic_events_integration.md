# Islamic Events Integration

This document explains how automatically-generated Islamic calendar events work: from the static JSON definitions through to the Hijri-to-Gregorian conversion, localStorage management, backend sync, and the sidebar UI.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Event Definitions — islamicEvents.json](#event-definitions)
4. [Hijri Date Conversion — hijriUtils.js](#hijri-date-conversion)
5. [ID Strategy](#id-strategy)
6. [CalendarContext — Local Storage Layer](#calendarcalendar-context)
7. [IslamicEventsPanel — Sidebar UI](#islamiceventspanel)
8. [Calendar Component — Sync & Refresh](#calendar-component)
9. [Backend — Batch Upsert Endpoint](#backend-batch-endpoint)
10. [Database Schema Changes](#database-schema)
11. [Data Flow Diagrams](#data-flow-diagrams)
12. [Adding / Editing Events](#adding--editing-events)

---

## Overview

Islamic calendar events (Ramadan, Eid, White Days, etc.) are defined once in a static JSON file and auto-generated as full calendar event objects for every Gregorian year the user visits. Events are stored in the browser's `localStorage` so they appear instantly without requiring authentication or a network request.

For authenticated users, a **Sync** button pushes all local events to the backend in a single batch request. A **Refresh** button pulls the latest events from the backend, ensuring the device stays in sync.

---

## Architecture

```
islamicEvents.json          ← Static definitions (28 entries)
       │
       ▼
hijriUtils.js               ← generateIslamicEventsForYear()
       │  (iterates 365 days, matches Hijri dates)
       ▼
CalendarContext.jsx          ← ensureIslamicEventsForYear()
       │  merges new events into localStorage
       │
       ├──► localStorage["calendarEvents"]      ← events state
       ├──► localStorage["calendarGeneratedYears"]
       └──► localStorage["islamicEventsDisabled"]
       │
       ▼
Calendar.jsx (component)     ← reads events state, renders grid
IslamicEventsPanel.jsx       ← checkbox sidebar, calls toggleIslamicEvent()
       │
       ▼  (authenticated users only)
POST /api/events/batch       ← upserts all unsynced events
GET  /api/events             ← pulls latest events from DB
```

---

## Event Definitions

**File:** `app/src/data/islamicEvents.json`

Contains 28 entries covering all requested Islamic events. Each entry has the following shape:

```jsonc
{
  "id": "ramadan_begins",          // stable string ID, never changes
  "titleAr": "بداية رمضان",        // Arabic title (displayed in panel + event name)
  "titleEn": "Ramadan Begins",      // English title
  "description": "todo...",         // fill in later
  "hijriMonth": 9,                  // 1 = Muharram … 12 = Dhul Hijjah
  "hijriDay": 1,                    // trigger day (start of the event)
  "durationDays": 1,                // 3 for White Days, 10 for First 10 of DH, etc.
  "isAllDay": true,
  "eventTypeId": 1,                 // 1=Ramadan, 2=Eid, 4=Custom (matches DB EventType)
  "repeatsEachMonth": false,        // true only for White Days
  "category": "annual"              // "annual" | "monthly" | "monthStart"
}
```

### Categories

| Category | Count | Description |
|---|---|---|
| `annual` | 15 | One-off events per Hijri year (Eid, Hajj, Ashura, etc.) |
| `monthly` | 1 | White Days — fires on the 13th of every Hijri month |
| `monthStart` | 12 | First day of each Hijri month with its traditional subtitle |

### Full Event List

**Annual:**
- Islamic New Year (1 Muharram)
- Ashura (10 Muharram)
- Eid Mawlid un-Nabi (12 Rabi al-Awwal)
- Isra and Miraj (27 Rajab)
- Shab-e-Barat (15 Sha'ban)
- Ramadan Begins (1 Ramadan)
- Last 10 Nights Begin (21 Ramadan)
- Laylatul Qadr (27 Ramadan)
- Eid ul-Fitr (1 Shawwal)
- Dhul Hijjah Begins (1 Dhul Hijjah)
- First 10 Days of Dhul Hijjah (1–10 Dhul Hijjah)
- Hajj (8–13 Dhul Hijjah)
- Day of Arafah (9 Dhul Hijjah)
- Eid al-Adha (10 Dhul Hijjah)
- Days of Tashreeq (11–13 Dhul Hijjah)

**Monthly:** White Days (13–15 of every Hijri month) × 12 = 12 events/year

**Month Starts:** Muharram through Dhul Hijjah (12 events/year)

Total generated per Gregorian year: **~70 events** (15 annual + 12 white-day groups + 12 month starts, plus any that appear twice because a Gregorian year can contain two instances of the same Hijri month).

---

## Hijri Date Conversion

**File:** `app/src/util/hijriUtils.js`

### No external library needed

The browser's built-in `Intl.DateTimeFormat` API with locale `"en-u-ca-islamic-umalqura"` is the standard for Umm al-Qura (Saudi Arabia) Islamic dates. This is the same API already used in `Calendar.jsx` for displaying Hijri dates in the toolbar.

### `getHijriNumericParts(date)`

```js
import { getHijriNumericParts } from "../util/hijriUtils";

getHijriNumericParts(new Date(2026, 1, 18));
// → { day: 1, month: 9, year: 1447 }  (1 Ramadan 1447)
```

### `generateIslamicEventsForYear(year, definitions, disabledIds)`

Iterates every day of `year` (Jan 1 → Dec 31). For each day it:

1. Gets the Hijri numeric parts.
2. Checks each definition:
   - **Day match:** `hijri.day === def.hijriDay`
   - **Month match:** `def.repeatsEachMonth || hijri.month === def.hijriMonth`
3. Builds a unique `islamicEventKey` to prevent duplicates (a Gregorian year spans two Hijri years, so the same Hijri month can appear twice).
4. Creates an event object with a string `eventId`.

```js
generateIslamicEventsForYear(2026, definitions, []);
// Returns ~70 event objects, each with:
// { eventId: "islamic_ramadan_begins_1447", islamicEventKey: "ramadan_begins_1447",
//   islamicDefinitionId: "ramadan_begins", name: "بداية رمضان | Ramadan Begins",
//   startDate: "2026-02-18T00:00:00.000Z", ... }
```

---

## ID Strategy

Three different IDs track each Islamic event through its lifecycle:

| ID | Location | Example | Purpose |
|---|---|---|---|
| `islamicDefinitionId` | JSON + localStorage | `"ramadan_begins"` | Identifies the *type* of event; used by the panel's checkboxes and `islamicEventsDisabled` |
| `islamicEventKey` | localStorage + DB column | `"ramadan_begins_1447"` | Year-specific; sent to the backend as the upsert key per `(userId, islamicEventKey)` |
| `eventId` | localStorage (primary key) | `"islamic_ramadan_begins_1447"` → `42` after sync | String while local; replaced with the backend's integer after a successful sync |

### Why three IDs?

- `islamicDefinitionId` is **year-independent** — toggling White Days in the panel removes all instances across all years.
- `islamicEventKey` includes the **Hijri year** — "Ramadan 1447" and "Ramadan 1448" have different keys even though they both fall in Gregorian year 2026.
- `eventId` is the **local primary key** used by React state. It becomes an integer only after sync, allowing the frontend to skip already-synced events on re-sync.

---

## CalendarContext — Local Storage Layer

**File:** `app/src/contexts/CalendarContext.jsx`

### localStorage keys

| Key | Type | Description |
|---|---|---|
| `calendarView` | `string` | Persisted view preference (month/week/day) |
| `calendarEvents` | `Event[]` | All events — Islamic + user-created |
| `calendarGeneratedYears` | `number[]` | Gregorian years for which Islamic events have been generated |
| `islamicEventsDisabled` | `string[]` | Definition IDs the user has unchecked in the panel |

### Context API

```ts
// Events CRUD
addEvent(eventData): Promise<Event>
updateEvent(eventId, updates): Promise<Event>
removeEvent(eventId): Promise<void>

// Islamic event management
ensureIslamicEventsForYear(year: number): void
toggleIslamicEvent(definitionId: string, enabled: boolean): void
disabledIslamicEvents: string[]

// Backend sync
syncToBackend(): Promise<void>     // batch-POST unsynced Islamic events
refreshFromBackend(): Promise<void> // GET all events and merge
isSyncing: boolean
isRefreshing: boolean
```

### Lifecycle

```
Component mounts
    │
    ├─ setEvents(localStorage["calendarEvents"] || [])   ← instant, no network
    ├─ APIClient.getProviders()                          ← background, non-blocking
    └─ ensureIslamicEventsForYear(currentYear)           ← generates if new year
           │
           ├─ checks localStorage["calendarGeneratedYears"]
           ├─ calls generateIslamicEventsForYear()
           └─ merges new events into localStorage + state
```

### addEvent behaviour

For user-created events:
- **Authenticated:** POST to API → returns integer `eventId` → saved to localStorage.
- **Unauthenticated / API error:** Falls back to a `local_<timestamp>` string ID. Event is saved locally until the user logs in and manually syncs.

---

## IslamicEventsPanel — Sidebar UI

**File:** `app/src/components/calendar/IslamicEventsPanel.jsx`

A collapsible sidebar (288px wide) on the left side of the calendar page. Collapsed state shows a 40px strip with a toggle arrow.

### Sections

1. **Annual Events** — 15 checkboxes
2. **Monthly** — 1 checkbox (White Days)
3. **Month Starts** — 12 checkboxes

### Behaviour

- **All events start checked** — `islamicEventsDisabled` is empty by default, so every event is generated.
- **Checking** an event calls `toggleIslamicEvent(id, true)`:
  1. Removes the ID from `islamicEventsDisabled`.
  2. Re-generates events for all already-visited years (so past months reflect the change immediately).
- **Unchecking** an event calls `toggleIslamicEvent(id, false)`:
  1. Adds the ID to `islamicEventsDisabled`.
  2. Removes all matching events from `calendarEvents` in localStorage and state.
- **Select All** checkbox uses indeterminate state when only some events are enabled.

---

## Calendar Component — Sync & Refresh

**File:** `app/src/components/calendar/Calendar.jsx`

### Year-change hook

```js
useEffect(() => {
  ensureIslamicEventsForYear(cursor.getFullYear());
}, [cursor.getFullYear()]);
```

Whenever the user navigates to a new year, Islamic events for that year are lazily generated.

### Toolbar buttons

| Button | Visible when | Action |
|---|---|---|
| **Sync** | Always | Authenticated: `syncToBackend()`. Guest: opens login dialog. |
| **Refresh** | Authenticated only | `refreshFromBackend()` |

### Login dialog

A lightweight MUI `<Dialog>` with:
- "Continue with Google" → redirects to Google OAuth
- "Sign in with Email" → navigates to `/login`

No login form is embedded — keeps the dialog minimal and delegates to the existing auth pages.

### Sync flow

```
User clicks Sync (authenticated)
    │
    ▼
CalendarContext.syncToBackend()
    │
    ├─ Filters events where typeof eventId === "string" && islamicEventKey present
    ├─ Strips islamicDefinitionId (local-only field)
    └─ APIClient.bulkCreateEvents(payload)
           │
           ▼
       POST /api/events/batch
           │
           ▼  Backend upserts each event, returns integer eventIds
           │
    ├─ Builds islamicEventKey → backendId map
    └─ Replaces string eventIds with integers in localStorage + state
```

### Refresh flow

```
User clicks Refresh (authenticated)
    │
    ▼
CalendarContext.refreshFromBackend()
    │
    ├─ GET /api/events → backendEvents[]
    ├─ Preserves local-only events (string eventIds)
    ├─ Enriches backend events with local-side extra fields (islamicDefinitionId)
    └─ Saves merged array to localStorage + state
```

---

## Backend — Batch Upsert Endpoint

**File:** `api/src/endpoints/events/BulkCreateEvents.js`

### Route

```
POST /api/events/batch
Authorization: Bearer <token>  (required)
```

> **Important:** This route is registered *before* `/events/:eventId` in `Routes.js` to prevent Express matching `"batch"` as an `eventId` parameter.

### Request body

```json
{
  "events": [
    {
      "name": "بداية رمضان | Ramadan Begins",
      "startDate": "2026-02-18T00:00:00.000Z",
      "endDate": "2026-02-18T23:59:59.999Z",
      "isAllDay": true,
      "eventTypeId": 1,
      "islamicEventKey": "ramadan_begins_1447",
      "description": "todo...",
      "hide": false,
      "isCustom": false,
      "isTask": false
    }
  ]
}
```

### Response (201)

```json
{
  "success": true,
  "events": [
    {
      "eventId": 42,
      "name": "بداية رمضان | Ramadan Begins",
      "islamicEventKey": "ramadan_begins_1447",
      ...
    }
  ]
}
```

### Upsert SQL (EventDOA.bulkUpsert)

```sql
INSERT INTO event (userid, name, startdate, ..., islamiceventkey, ...)
VALUES ($1, $2, ..., $11, ...)
ON CONFLICT (userid, islamiceventkey)
  WHERE islamiceventkey IS NOT NULL
DO UPDATE SET
  name = EXCLUDED.name,
  startdate = EXCLUDED.startdate,
  ...
  updatedat = NOW()
RETURNING *;
```

All events are processed inside a single `BEGIN … COMMIT` transaction. Any failure rolls back the entire batch.

---

## Database Schema

**File:** `Sql.Migrations/init.sql`

### New column on `Event`

```sql
IslamicEventKey VARCHAR(256)  -- nullable
```

### New partial unique index

```sql
CREATE UNIQUE INDEX idx_event_islamic_key
    ON Event (UserId, IslamicEventKey)
    WHERE IslamicEventKey IS NOT NULL;
```

**Why partial?** PostgreSQL's `UNIQUE` constraint treats `NULL ≠ NULL`, so two rows with `IslamicEventKey = NULL` would not conflict — which is exactly what we want for user-created events. The `WHERE IslamicEventKey IS NOT NULL` clause makes the index only enforce uniqueness for Islamic events, enabling the `ON CONFLICT` clause in the upsert.

---

## Data Flow Diagrams

### First visit (unauthenticated)

```
Browser opens calendar page
    │
    ▼
CalendarContext mounts
    ├─ Read localStorage["calendarEvents"]  → []  (empty)
    ├─ Read localStorage["calendarGeneratedYears"] → []
    └─ ensureIslamicEventsForYear(2026)
           │
           ▼
       generateIslamicEventsForYear(2026, allDefs, [])
           │  iterate 365 days
           │  match Hijri dates
           ▼
       ~70 event objects
           │
           ▼
       Merge into localStorage["calendarEvents"]
       localStorage["calendarGeneratedYears"] = [2026]
           │
           ▼
       setEvents(~70 events)  →  Calendar renders with Islamic events
```

### Sync (authenticated)

```
User clicks Sync
    │
    ▼
syncToBackend()
    ├─ unsynced = events where typeof eventId === "string" && islamicEventKey
    └─ APIClient.bulkCreateEvents(unsynced stripped of islamicDefinitionId)
           │
           ▼
       POST /api/events/batch
       (upsert per (userId, islamicEventKey))
           │
           ▼
       { events: [{ eventId: 42, islamicEventKey: "ramadan_begins_1447", ... }] }
           │
           ▼
       Replace "islamic_ramadan_begins_1447" → 42 in localStorage + state
```

---

## Adding / Editing Events

### To add a new Islamic event

1. Add an entry to `app/src/data/islamicEvents.json`.
2. Assign a unique `id`, correct `hijriMonth` + `hijriDay`, and appropriate `category`.
3. Set `description` to something meaningful (replace `"todo..."`).
4. Clear `localStorage["calendarGeneratedYears"]` in DevTools to force re-generation, or navigate to a new year.

### To fill in descriptions

All `description` fields are currently set to `"todo..."`. Update them directly in `islamicEvents.json`. The descriptions are passed through to the generated event objects and displayed in the event detail modal.

### To modify event types

The `eventTypeId` references the `EventType` table in the database:
- `1` = Ramadan
- `2` = Eid
- `3` = Jumah
- `4` = Custom

If you add new event types, update the `INSERT INTO EventType` seed in `init.sql` and assign the new ID in `islamicEvents.json`.
