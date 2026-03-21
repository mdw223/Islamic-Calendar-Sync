/**
 * IslamicEventService.js
 *
 * Shared service used by:
 *   - POST /events/generate  (explicit generation for a year)
 *   - passport.js             (auto-generate after Google OAuth / new user)
 *
 * Loads definitions from islamicEvents.json, merges user preferences from the
 * DB, generates events via hijriUtils, and delegates to EventDOA.bulkUpsert
 * for idempotent persistence.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const islamicEventsData = require("../data/islamicEvents.json");

import { generateIslamicEventsForYear } from "../util/HijriUtils.js";
import IslamicDefinitionPreferenceDOA from "../model/db/doa/IslamicDefinitionPreferenceDOA.js";
import EventDOA from "../model/db/doa/EventDOA.js";
import UserDOA from "../model/db/doa/UserDOA.js";

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
 * Generate Islamic events for a given user across one or more years.
 * Loads preferences, generates events for each year, upserts to DB in one batch.
 *
 * @param {number} userId
 * @param {number[]} years - Array of Gregorian years.
 * @returns {Promise<{ events: Object[], generatedCount: number }>}
 */
export async function generateForUser(userId, years, timezone = null) {
  const mergedDefs = await getMergedDefinitions(userId);

  const allGenerated = [];
  for (const year of years) {
    const generated = generateIslamicEventsForYear(year, mergedDefs, timezone);
    allGenerated.push(...generated);
  }

  if (allGenerated.length === 0) {
    return { events: [], generatedCount: 0 };
  }

  const persisted = await EventDOA.bulkUpsert(allGenerated, userId);
  const user = await UserDOA.findById(userId);
  if (user) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const nextStart =
      user.generatedYearsStart == null
        ? minYear
        : Math.min(user.generatedYearsStart, minYear);
    const nextEnd =
      user.generatedYearsEnd == null
        ? maxYear
        : Math.max(user.generatedYearsEnd, maxYear);
    await UserDOA.updateGeneratedYearsRange(userId, nextStart, nextEnd);
  }
  return { events: persisted, generatedCount: persisted.length };
}

/**
 * Generate Islamic events for a new user (current year, all definitions enabled).
 * Called after user creation to preload baseline event data.
 * The upsert makes this idempotent — calling it redundantly is harmless.
 *
 * @param {number} userId
 * @returns {Promise<{ events: Object[], generatedCount: number }>}
 */
export async function generateForNewUser(userId) {
  return generateForUser(userId, [new Date().getFullYear()]);
}
