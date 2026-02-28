export const AuthUser = Object.freeze({
    ANY: 0, // not logged in
    SAME_USER: 1, 
    ADMIN: 2, 
    VALID_USER: 4, // authenticated
    GUEST_USER: 8,
    SUBSCRIBED_USER: 16 // additional features
});

/**
 * Enum-like mapping for ProviderType identifiers.
 * Backed by the PROVIDER_TYPE table (ProviderTypeId, Name).
 */
export const ProviderTypeId = Object.freeze({
  GOOGLE: 1,
  MICROSOFT: 2,
  APPLE: 3,
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