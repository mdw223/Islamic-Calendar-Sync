/**
 * IslamicEventService.js
 *
 * Shared service used by:
 *   - POST /events/generate  (explicit generation for a year)
 *   - GuestSessionMiddleware  (auto-generate for new guests)
 *   - passport.js             (auto-generate after Google OAuth / new user)
 *
 * Loads definitions from islamicEvents.json, merges user preferences from the
 * DB, generates events via hijriUtils, and delegates to EventDOA.bulkUpsert
 * for idempotent persistence.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const islamicEventsData = require("../data/islamicEvents.json");

import { generateIslamicEventsForYear } from "../util/hijriUtils.js";
import IslamicDefinitionPreferenceDOA from "../model/db/doa/IslamicDefinitionPreferenceDOA.js";
import EventDOA from "../model/db/doa/EventDOA.js";

/**
 * Get the base definitions from the JSON file.
 * @returns {Array<Object>}
 */
export function getBaseDefinitions() {
  return islamicEventsData.events;
}

/**
 * Merge base definitions with user-specific preferences from the DB.
 * @param {number} userId
 * @returns {Promise<Array<Object>>} Definitions with `isHidden` flags applied.
 */
export async function getMergedDefinitions(userId) {
  const baseDefs = getBaseDefinitions();
  const prefs = await IslamicDefinitionPreferenceDOA.findAllByUserId(userId);
  const prefMap = new Map(prefs.map((p) => [p.definitionId, p.isHidden]));

  return baseDefs.map((def) => ({
    ...def,
    isHidden: prefMap.has(def.id) ? prefMap.get(def.id) : def.isHidden ?? false,
  }));
}

/**
 * Generate Islamic events for a given user and year.
 * Loads preferences, generates events, upserts to DB.
 *
 * @param {number} userId
 * @param {number} year - Gregorian year.
 * @returns {Promise<{ events: Object[], generatedCount: number }>}
 */
export async function generateForUser(userId, year) {
  const mergedDefs = await getMergedDefinitions(userId);
  const generated = generateIslamicEventsForYear(year, mergedDefs);

  if (generated.length === 0) {
    return { events: [], generatedCount: 0 };
  }

  const persisted = await EventDOA.bulkUpsert(generated, userId);
  return { events: persisted, generatedCount: persisted.length };
}

/**
 * Generate Islamic events for a new user (current year, all definitions enabled).
 * Called from GuestSessionMiddleware and passport.js after user creation.
 * The upsert makes this idempotent — calling it redundantly is harmless.
 *
 * @param {number} userId
 * @returns {Promise<{ events: Object[], generatedCount: number }>}
 */
export async function generateForNewUser(userId) {
  return generateForUser(userId, new Date().getFullYear());
}
