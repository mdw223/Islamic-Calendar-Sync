/**
 * localStorage.js
 *
 * Thin wrappers around localStorage so that JSON parse errors, missing keys,
 * and quota/private-browsing restrictions are always handled gracefully.
 */

import { CALENDAR_VIEW_KEY, VALID_VIEWS } from "../Constants";

/**
 * Read a JSON value from localStorage.
 *
 * @param {string} key      localStorage key
 * @param {*}      fallback Value returned when the key is missing or unparseable
 * @returns {*}
 */
export function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Write a JSON-serialisable value to localStorage.
 *
 * @param {string} key
 * @param {*}      value
 */
export function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(
      "localStorage may be unavailable in private browsing or when full. Error writing to localStorage for key: ",
      key,
      ". Error: ",
      error,
    );
  }
}

/**
 * Read the persisted calendar view preference, falling back to "month".
 *
 * @returns {"month"|"week"|"day"}
 */
export function getSavedView() {
  const saved = localStorage.getItem(CALENDAR_VIEW_KEY);
  return VALID_VIEWS.includes(saved) ? saved : "month";
}
