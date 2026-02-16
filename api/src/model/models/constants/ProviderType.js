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

export const ProviderTypeName = Object.freeze({
  [ProviderTypeId.GOOGLE]: "Google",
  [ProviderTypeId.MICROSOFT]: "Microsoft",
  [ProviderTypeId.APPLE]: "Apple",
  [ProviderTypeId.CALCOM]: "Cal.com",
});

