-- Store a separate definition attribution for user-created events.
ALTER TABLE Event
ADD COLUMN IF NOT EXISTS AttributedDefinitionId VARCHAR(256);
