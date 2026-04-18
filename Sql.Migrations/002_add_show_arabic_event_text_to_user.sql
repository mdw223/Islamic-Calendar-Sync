-- Persist user preference for showing Arabic in event titles/definitions.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS ShowArabicEventText BOOLEAN NOT NULL DEFAULT TRUE;
