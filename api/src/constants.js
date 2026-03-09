export const AuthUser = Object.freeze({
    ANY: 0, // not logged in
    SAME_USER: 1, 
    ADMIN: 2, 
    VALID_USER: 4, // authenticated
    SUBSCRIBED_USER: 16 // additional features
});

/**
 * Enum-like mapping for AuthProviderType identifiers.
 * Backed by the AuthProviderType table (AuthProviderTypeId, Name).
 */
export const AuthProviderTypeId = Object.freeze({
  GOOGLE: 1,
  MICROSOFT: 2,
  APPLE: 3,
  EMAIL: 4,
});

/**
 * Enum-like mapping for CalendarProviderType identifiers.
 * Backed by the CalendarProviderType table (CalendarProviderTypeId, Name).
 */
export const CalendarProviderTypeId = Object.freeze({
  GOOGLE_CALENDAR: 1,
  MICROSOFT_OUTLOOK: 2,
  APPLE_CALENDAR: 3,
  CALCOM: 4,
});

/**
 * Enum-like mapping for EventType identifiers.
 * Backed by the EventType table (EventTypeId, Name).
 */
export const EventTypeId = Object.freeze({
  RAMADAN: 1,
  EID: 2,
  JUMAH: 3,
  CUSTOM: 4,
});