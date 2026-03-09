BEGIN;

-- Remove legacy guest users before dropping guest-specific schema.
DELETE FROM "User" u
USING AuthProviderType apt
WHERE u.AuthProviderTypeId = apt.AuthProviderTypeId
  AND apt.Name = 'Guest';

ALTER TABLE "User" DROP COLUMN IF EXISTS SessionID;
ALTER TABLE "User" DROP COLUMN IF EXISTS IsGuest;

-- Remove the guest auth provider type now that guest accounts are no longer supported.
DELETE FROM AuthProviderType
WHERE Name = 'Guest';

COMMIT;
