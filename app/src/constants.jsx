import islamicEventsData from "./data/islamicEvents.json";

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
export const VIEW_STORAGE_KEY = "calendarView";
export const VALID_VIEWS = ["month", "week", "day"];

export const EVENTS_KEY = "calendarEvents"; // stores the generated events
export const GENERATED_YEARS_KEY = "calendarGeneratedYears"; // stores which years have been generated already
export const ISLAMIC_DEFS_KEY = "islamicEventDefs"; // controls which types of events get generated

export const ALL_DEFINITIONS = islamicEventsData.events; // fallback

// Auth constants
export const AUTH_TOKEN_KEY = "authToken";
