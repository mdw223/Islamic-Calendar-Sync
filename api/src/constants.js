export const AuthUser = Object.freeze({
    ANY: 0, // not logged in
    SAME_USER: 1, 
    ADMIN: 2, 
    VALID_USER: 4, // authenticated
    SUBSCRIBED_USER: 8 // additional features
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