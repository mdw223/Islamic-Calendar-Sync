// Calendar constants
export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Calendar context constants
export const CALENDAR_VIEW_KEY = "calendarView";
export const VALID_VIEWS = ["month", "week", "day"];

// Auth constants
export const AUTH_TOKEN_KEY = "authToken";

/**
 * Enum-like mapping for EventType identifiers.
 * Backed by the EventType table (EventTypeId, Name).
 *
 * Used for user to group events by causes
 */
export const EventTypeId = Object.freeze({
  RAMADAN: 1,
  EID: 2,
  JUMAH: 3,
  CUSTOM: 4,
}); // TODO: maybe will remove later
