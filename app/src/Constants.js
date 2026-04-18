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

export const SubscriptionDefinitionId = Object.freeze({
  INCLUDE_USER_CREATED_EVENTS: "include_user_created_events",
});

export const SHOW_USER_CREATED_EVENTS_KEY = "showUserCreatedEvents";
