/**
 * Migration: Add color columns for Islamic definition and event coloring feature
 * 
 * This migration adds support for:
 * 1. Definition-level color overrides (stored in UserIslamicDefinitionPreference.DefaultColor)
 * 2. Event-level custom colors (stored in Event.Color)
 * 
 * Backward compatibility: Both columns are nullable and optional.
 * Existing events and definitions retain null color, falling back to default type-based colors.
 * 
 * Execution: Run this script once on any existing database to enable the color feature.
 */

-- Add color column to Event table
-- Stores per-event custom color in #RRGGBB format (only for custom events, not definition-linked)
ALTER TABLE Event ADD COLUMN Color VARCHAR(7);

-- Add defaultColor column to UserIslamicDefinitionPreference table
-- Stores the user's color override for an Islamic definition
ALTER TABLE UserIslamicDefinitionPreference ADD COLUMN DefaultColor VARCHAR(7);

-- Create index on (UserId, IslamicDefinitionId) for definition toggle queries
-- (This helps if index doesn't already exist)
-- Note: This may fail silently if index already exists; that's expected.
CREATE INDEX IF NOT EXISTS idx_event_userid_definition 
ON Event(UserId, IslamicDefinitionId);

-- Verification query (run manually to verify the migration):
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name IN ('Event', 'UserIslamicDefinitionPreference')
-- AND column_name IN ('Color', 'DefaultColor');
