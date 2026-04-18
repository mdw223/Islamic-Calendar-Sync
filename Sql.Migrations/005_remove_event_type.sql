-- Remove legacy event type artifacts.
ALTER TABLE IF EXISTS Event
  DROP COLUMN IF EXISTS EventTypeId CASCADE;

DROP TABLE IF EXISTS EventType CASCADE;
