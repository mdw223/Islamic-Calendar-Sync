/**
 * OfflineDb.js
 *
 * Dexie (IndexedDB) database for offline / unauthenticated guest users.
 *
 * Tables mirror the relevant Postgres tables but without UserId — all data
 * belongs to the single local guest.  On login the data is synced to the
 * backend via POST /events/sync and POST /definitions/sync, then cleared.
 *
 * Schema version history:
 *   v1 — initial: events, definitionPreferences
 */

import Dexie from "dexie";

const db = new Dexie("IslamicCalendarSync");

db.version(2).stores({
  // ++id  = auto-increment primary key
  // Indexed fields after the PK allow efficient querying / upsert-by-key.
  events: "++id, islamicDefinitionId, eventTypeId, startDate",

  // definitionId is the primary key (matches islamicEvents.json `id`).
  definitionPreferences: "definitionId",
});

export default db;
