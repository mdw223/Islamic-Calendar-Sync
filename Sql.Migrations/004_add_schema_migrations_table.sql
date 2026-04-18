-- Track applied SQL migrations for existing databases.
CREATE TABLE IF NOT EXISTS SchemaMigration (
  MigrationId VARCHAR(255) PRIMARY KEY,
  Checksum VARCHAR(64) NOT NULL,
  AppliedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  AppliedBy VARCHAR(255) NOT NULL DEFAULT CURRENT_USER
);

CREATE INDEX IF NOT EXISTS idx_schemamigration_appliedat
  ON SchemaMigration (AppliedAt DESC);

-- Backfill prior migrations on databases that were manually updated.
INSERT INTO SchemaMigration (MigrationId, Checksum)
SELECT '001_add_event_and_preference_colors', 'legacy'
WHERE EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'event' AND column_name = 'color'
)
ON CONFLICT (MigrationId) DO NOTHING;

INSERT INTO SchemaMigration (MigrationId, Checksum)
SELECT '002_add_show_arabic_event_text_to_user', 'legacy'
WHERE EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'User' AND column_name = 'showarabiceventtext'
)
ON CONFLICT (MigrationId) DO NOTHING;

INSERT INTO SchemaMigration (MigrationId, Checksum)
SELECT '003_add_attributed_definition_id_to_event', 'legacy'
WHERE EXISTS (
  SELECT 1
  FROM information_schema.columns
  WHERE table_name = 'event' AND column_name = 'attributeddefinitionid'
)
ON CONFLICT (MigrationId) DO NOTHING;
