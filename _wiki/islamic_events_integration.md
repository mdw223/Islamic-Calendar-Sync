# Islamic Events Integration

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Data Flow](#data-flow)
- [Definition Data](#definition-data)
- [Hijri Date Conversion](#hijri-date-conversion)
- [Event Generation (Backend)](#event-generation-backend)
  - [Generation Algorithm](#generation-algorithm)
  - [Idempotent Upsert](#idempotent-upsert)
  - [Auto-Generation on User Creation](#auto-generation-on-user-creation)
- [API Endpoints](#api-endpoints)
  - [POST /events/generate](#post-eventsgenerate)
  - [GET /definitions](#get-definitions)
  - [PUT /definitions/:definitionId](#put-definitionsdefinitionid)
- [Database Schema](#database-schema)
  - [Event Table (partial)](#event-table-partial)
  - [UserIslamicDefinitionPreference Table](#userislamicdefinitionpreference-table)
- [Frontend Integration](#frontend-integration)
  - [CalendarContext](#calendarcontext)
  - [IslamicEventsPanel](#islamiceventspanel)
  - [hijriUtils.js (Frontend)](#hijriutilsjs-frontend)
- [Key Design Decisions](#key-design-decisions)

---

## Overview

Islamic events (Ramadan, Eid al-Fitr, Hajj, White Days, etc.) are generated **server-side** from a static JSON catalogue of 27 definitions. The backend converts Gregorian dates to Hijri using the Node.js `Intl.DateTimeFormat` API with the `islamic-umalqura` calendar and produces one database row per event occurrence per user.

Users can show/hide individual event types via per-user preferences stored in the `UserIslamicDefinitionPreference` table. The frontend no longer performs any event generation — it calls the API and displays results.

---

## Architecture

```
┌─────────────────┐         ┌─────────────────────────────────────────┐
│   React App     │         │   Express API                           │
│                 │         │                                         │
│  CalendarContext │──POST──▶│  /events/generate                      │
│                 │  /events│    └─ IslamicEventService.generateForUser│
│  IslamicEvents  │──GET───▶│  /definitions                           │
│  Panel          │         │    └─ IslamicEventService.getMergedDefs  │
│                 │──PUT───▶│  /definitions/:id                       │
│                 │         │    └─ IslamicDefinitionPreferenceDOA     │
└─────────────────┘         │    └─ EventDOA.updateHideByDefinitionId │
                            └──────────────┬──────────────────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │  PostgreSQL  │
                                    │  Event table │
                                    │  Preference  │
                                    │  table       │
                                    └─────────────┘
```

---

## Data Flow

1. **User created** (Google OAuth or email verification) → backend auto-generates Islamic events for the current Gregorian year via `generateForNewUser()`.
2. **On mount**, the frontend loads events and definitions in parallel (`GET /events` + `GET /definitions`).
3. **When navigating** to a new Gregorian year, the frontend calls `POST /events/generate` with that year. The backend upserts events idempotently — duplicates are silently skipped.
4. **Toggling** an event type calls `PUT /definitions/:definitionId` which updates the user's preference **and** sets `Hide` on all matching events in one transaction.
5. **Resetting** deletes all events, clears preferences, and re-generates.

---

## Definition Data

The source of truth for Islamic event definitions is `api/src/data/islamicEvents.json`.

Each definition has the following shape:

| Field              | Type    | Description                                                              |
| ------------------ | ------- | ------------------------------------------------------------------------ |
| `id`               | string  | Stable identifier, e.g. `"ramadan_begins"`                               |
| `titleAr`          | string  | Arabic name                                                              |
| `titleEn`          | string  | English name                                                             |
| `hijriMonth`       | number  | Hijri month (1–12) the event falls in                                    |
| `hijriDay`         | number  | Hijri day of the month                                                   |
| `durationDays`     | number  | Duration in calendar days (default 1)                                    |
| `isAllDay`         | boolean | Whether the event spans full days                                        |
| `eventTypeId`      | number  | Maps to the `EventType` table (1=Ramadan, 2=Eid…)                        |
| `repeatsEachMonth` | boolean | `true` for events like White Days (13th of every Hijri month)            |
| `category`         | string  | `"annual"`, `"monthly"`, or `"monthStart"` — used by the UI for grouping |
| `isHidden`         | boolean | Default visibility (usually `false`)                                     |

There are 27 definitions across three categories:

- **Annual** — one-off events like Ramadan, Eid al-Fitr, Eid al-Adha, Islamic New Year, etc.
- **Monthly** — recurring events like the White Days (13th–15th of every Hijri month).
- **Month Start** — first day of each Hijri month (12 definitions).

---

## Hijri Date Conversion

Both the backend (`api/src/util/hijriUtils.js`) and the frontend (`app/src/util/hijriUtils.js`) use the built-in `Intl.DateTimeFormat` with locale `"en-u-ca-islamic-umalqura"`.

```js
const formatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
});
```

The `formatToParts()` method returns typed components (`day`, `month`, `year`) which are parsed into integers. No external Hijri library is needed — Node.js 22 ships full ICU data.

**Frontend-only** utilities (display purposes):

- `getHijriParts(date)` — returns `{ day, month, year }` with a long month name.
- `getHijriMonthRangeLabel(year, month)` — e.g. `"Ramadan – Shawwal 1447 AH"`.

**Backend-only** utility:

- `generateIslamicEventsForYear(gregorianYear, definitions)` — described next.

---

## Event Generation (Backend)

Located in `api/src/util/hijriUtils.js` and orchestrated by `api/src/services/IslamicEventService.js`.

### Generation Algorithm

1. **Build lookup maps** — definitions are bucketed by `(hijriDay, hijriMonth)` for O(1) lookup per calendar day. Monthly definitions (e.g. White Days) are in a separate list matched only on day.
2. **Scan every day** of the Gregorian year (365–366 `Intl.formatToParts` calls).
3. **Match** each day's Hijri date against the lookup.
4. **Deduplicate** using `islamicEventKey`:
   - Annual events: `"<defId>_<hijriYear>"` (e.g. `"ramadan_begins_1447"`)
   - Monthly events: `"<defId>_<hijriMonth>_<hijriYear>"` (e.g. `"white_days_9_1447"`)
5. **Return** an array of event objects with `startDate`, `endDate`, `islamicDefinitionId`, `islamicEventKey`, etc.

**Edge cases handled:**

- A Gregorian year spans two Hijri years (e.g. 2026 → 1447 + 1448).
- Multi-day events (Hajj = 5 days, White Days = 3 days) — only triggered once, on the start day, with `endDate` offset.
- Multiple definitions sharing the same Hijri date produce separate events.

### Idempotent Upsert

`EventDOA.bulkUpsert()` uses PostgreSQL's `ON CONFLICT` on the partial unique index:

```sql
CREATE UNIQUE INDEX idx_event_islamic_key
  ON "Event" ("UserId", "IslamicEventKey")
  WHERE "IslamicEventKey" IS NOT NULL;
```

Calling `POST /events/generate` for the same year twice results in zero duplicates — the conflicting rows are updated in place.

### Auto-Generation on User Creation

`passport.js` (Google OAuth callback) fires a call to `IslamicEventService.generateForNewUser(userId)` after user creation. This ensures a new user sees Islamic events on first load without an extra client round-trip.

---

## API Endpoints

### POST /events/generate

Generates Islamic events for a given Gregorian year.

| Parameter | Location | Type   | Description                |
| --------- | -------- | ------ | -------------------------- |
| `year`    | body     | number | Gregorian year (2000–2100) |

**Response** `201 Created`:

```json
{
  "events": [
    /* array of Event objects */
  ]
}
```

The response includes **all** events for that year (both newly created and existing). The client merges them into state, skipping duplicates by `islamicEventKey`.

### GET /definitions

Returns the full list of 27 Islamic event definitions, with per-user `isHidden` preferences merged in.

**Response** `200 OK`:

```json
{
  "definitions": [
    {
      "id": "ramadan_begins",
      "titleAr": "بداية رمضان",
      "titleEn": "Ramadan Begins",
      "hijriMonth": 9,
      "hijriDay": 1,
      "category": "annual",
      "isHidden": false
    }
  ]
}
```

### PUT /definitions/:definitionId

Updates a single definition's show/hide preference for the current user.

| Parameter      | Location | Type    | Description     |
| -------------- | -------- | ------- | --------------- |
| `definitionId` | path     | string  | Definition `id` |
| `isHidden`     | body     | boolean | `true` to hide  |

**Response** `200 OK`:

```json
{ "definitionId": "ramadan_begins", "isHidden": true }
```

Side effect: all existing events matching that `islamicDefinitionId` have their `Hide` column updated in the same request.

---

## Database Schema

### Event Table (partial)

Columns relevant to Islamic events:

| Column                | Type         | Notes                                                       |
| --------------------- | ------------ | ----------------------------------------------------------- |
| `IslamicDefinitionId` | VARCHAR(256) | Stable definition id from JSON (nullable for custom events) |
| `IslamicEventKey`     | VARCHAR(512) | Year-scoped dedup key (nullable for custom events)          |
| `Hide`                | BOOLEAN      | Controlled by definition preference toggle                  |

The partial unique index `idx_event_islamic_key` on `(UserId, IslamicEventKey) WHERE IslamicEventKey IS NOT NULL` ensures upsert idempotency.

### UserIslamicDefinitionPreference Table

```sql
CREATE TABLE "UserIslamicDefinitionPreference" (
    "UserId"       INTEGER      NOT NULL,
    "DefinitionId" VARCHAR(256) NOT NULL,
    "IsHidden"     BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY ("UserId", "DefinitionId"),
    FOREIGN KEY ("UserId") REFERENCES "User"("UserId") ON DELETE CASCADE
);
```

Stores per-user overrides of the default `isHidden` value from `islamicEvents.json`. Missing rows mean "use the definition default".

---

## Frontend Integration

### CalendarContext

`app/src/contexts/CalendarContext.jsx` is the central state manager.

- **On mount**: fetches `GET /events` and `GET /definitions` in parallel.
- **`ensureIslamicEventsForYear(year)`**: called when the calendar navigates to a new year → fires `POST /events/generate`. Tracks generated years in a `useRef(new Set())` to avoid redundant network calls within a session.
- **`toggleIslamicEvent(definitionId)`**: optimistically updates local state (definitions + events), then calls `PUT /definitions/:definitionId`. Reverts on failure.
- **`resetCalendar()`**: deletes all events, reloads definitions from server, re-generates.
- **`islamicEventDefs`**: exposed to consumers (especially `IslamicEventsPanel`) for rendering checkboxes.

### IslamicEventsPanel

`app/src/components/calendar/IslamicEventsPanel.jsx` renders three collapsible groups of checkboxes (Annual, Monthly, Month Start). It derives the groups from `islamicEventDefs` via `useMemo`:

```jsx
const ANNUAL_DEFS = useMemo(
  () => islamicEventDefs.filter((d) => d.category === "annual"),
  [islamicEventDefs],
);
```

Toggling a checkbox calls `toggleIslamicEvent(definitionId)` from the context.

### hijriUtils.js (Frontend)

The frontend `hijriUtils.js` retains only display-oriented helpers:

- `getHijriParts(date)` — Hijri day/month/year with long month name.
- `getHijriNumericParts(date)` — numeric Hijri components.
- `getHijriMonthRangeLabel(year, month)` — label for calendar headers.
- `HIJRI_FORMATTER` — the reusable `Intl.DateTimeFormat` instance.

The `generateIslamicEventsForYear()` function has been removed from the frontend — all generation is server-side.

---

## Key Design Decisions

| Decision                           | Rationale                                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Server-side generation             | Removes ~200 lines of client code, ensures all users share the same generation logic, enables future batch operations        |
| `Intl.DateTimeFormat` (no library) | Node.js 22 has full ICU; avoids a dependency for Hijri conversion                                                            |
| Partial unique index for upsert    | Allows `ON CONFLICT` only on Islamic events while keeping `IslamicEventKey` nullable for custom events                       |
| Fire-and-forget auto-generation    | New users see events on first page load without an extra round-trip                                                          |
| Optimistic UI for toggles          | Checkbox state updates instantly; reverts if the API call fails                                                              |
| In-memory year tracking (`useRef`) | Avoids redundant `POST /events/generate` calls per session without needing localStorage                                      |
| Single API call for hide/show      | `PUT /definitions/:id` updates both the preference table and all matching events, replacing N individual `updateEvent` calls |
