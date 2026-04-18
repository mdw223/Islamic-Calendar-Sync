-- Initialize Database Schema for PostgreSQL
-- This script creates all tables for the prayer and event management system

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS Event CASCADE;
DROP TABLE IF EXISTS UserLocation CASCADE;
DROP TABLE IF EXISTS Prayer CASCADE;
DROP TABLE IF EXISTS PrayerType CASCADE;
DROP TABLE IF EXISTS CalculationMethod CASCADE;
DROP TABLE IF EXISTS Calendar CASCADE;
DROP TABLE IF EXISTS CalendarProvider CASCADE;
DROP TABLE IF EXISTS CalendarProviderType CASCADE;
DROP TABLE IF EXISTS Log CASCADE;
DROP TABLE IF EXISTS UserIslamicDefinitionPreference CASCADE;
DROP TABLE IF EXISTS MagicLinkUsedToken CASCADE;
DROP TABLE IF EXISTS SubscriptionDefinitionSelection CASCADE;
DROP TABLE IF EXISTS SubscriptionToken CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS AuthProviderType CASCADE;

-- Create CalculationMethod table
CREATE TABLE CalculationMethod (
    CalculationMethodId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);

-- Create AuthProviderType table (authentication methods for users)
CREATE TABLE AuthProviderType (
    AuthProviderTypeId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);

-- Create CalendarProviderType table (calendar integration providers)
CREATE TABLE CalendarProviderType (
    CalendarProviderTypeId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);

-- Create Users table
CREATE TABLE "User" (
    UserId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NULL,
    Email VARCHAR(255) NULL UNIQUE,
    CreatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    LastLogin TIMESTAMP,
    IsAdmin BOOLEAN DEFAULT FALSE,
    Language VARCHAR(10),
    GeneratedYearsStart INTEGER NULL,
    GeneratedYearsEnd INTEGER NULL,
    PrayerConfigurationStart TIMESTAMP NULL,
    PrayerConfigurationEnd TIMESTAMP NULL,
    CalculationMethodId INTEGER NULL,
    Hanafi BOOLEAN DEFAULT FALSE,
    Use24HourTime BOOLEAN NOT NULL DEFAULT FALSE,
    ShowArabicEventText BOOLEAN NOT NULL DEFAULT TRUE,
    Salt VARCHAR(255),
    EmailUpdates BOOLEAN DEFAULT TRUE,
    Notifications BOOLEAN DEFAULT TRUE,
    AuthProviderTypeId INTEGER NOT NULL,
    AccessToken VARCHAR(500),
    RefreshToken VARCHAR(500),
    ExpiresAt TIMESTAMP,
    Scopes VARCHAR(1000),
    IsExpired BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (CalculationMethodId) REFERENCES CalculationMethod(CalculationMethodId) ON DELETE RESTRICT,
    FOREIGN KEY (AuthProviderTypeId) REFERENCES AuthProviderType(AuthProviderTypeId) ON DELETE RESTRICT
);

-- Stores opaque subscription-feed tokens per user (multi-link support).
CREATE TABLE SubscriptionToken (
    SubscriptionTokenId SERIAL PRIMARY KEY,
    UserId INTEGER NOT NULL,
    Name VARCHAR(100) NULL,
    TokenHash VARCHAR(64) NOT NULL UNIQUE,
    Salt VARCHAR(255) NOT NULL,
    CreatedAt BIGINT NOT NULL,
    FOREIGN KEY (UserId) REFERENCES "User"(UserId) ON DELETE CASCADE
);

CREATE INDEX idx_subscriptiontoken_userid ON SubscriptionToken(UserId);
CREATE INDEX idx_subscriptiontoken_tokenhash ON SubscriptionToken(TokenHash);

-- Stores used magic-link JWTs by user key so one-time enforcement survives restarts.
CREATE TABLE MagicLinkUsedToken (
    UserUid VARCHAR(255) NOT NULL,
    Token TEXT NOT NULL,
    ExpiresAt BIGINT NOT NULL,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserUid, Token)
);

CREATE INDEX idx_magiclinkusedtoken_useruid ON MagicLinkUsedToken(UserUid);
CREATE INDEX idx_magiclinkusedtoken_expiresat ON MagicLinkUsedToken(ExpiresAt);

-- Selected definitions for each subscription URL (includes pseudo definitions).
CREATE TABLE SubscriptionDefinitionSelection (
        SubscriptionTokenId INTEGER NOT NULL,
        DefinitionId VARCHAR(256) NOT NULL,
        CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (SubscriptionTokenId, DefinitionId),
        FOREIGN KEY (SubscriptionTokenId) REFERENCES SubscriptionToken(SubscriptionTokenId) ON DELETE CASCADE
);

CREATE INDEX idx_subdefselection_tokenid
    ON SubscriptionDefinitionSelection(SubscriptionTokenId);

-- Create Log table (server-side application logs; values are redacted/sanitized at write time)
CREATE TABLE Log (
    LogId BIGSERIAL PRIMARY KEY,
    Timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    Level VARCHAR(20) NOT NULL,
    Message TEXT NOT NULL,
    Logger VARCHAR(100),
    RequestId UUID,
    UserId INTEGER NULL,
    HttpMethod VARCHAR(10),
    Path VARCHAR(500),
    StatusCode INTEGER,
    DurationMs INTEGER,
    Ip INET,
    UserAgent TEXT,
    ErrorCode VARCHAR(100),
    ErrorStack TEXT,
    Meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    FOREIGN KEY (UserId) REFERENCES "User"(UserId) ON DELETE SET NULL
);

CREATE INDEX idx_log_timestamp ON Log(Timestamp);
CREATE INDEX idx_log_level ON Log(Level);
CREATE INDEX idx_log_requestid ON Log(RequestId);
CREATE INDEX idx_log_userid ON Log(UserId);

-- Create CalendarProvider table
CREATE TABLE CalendarProvider (
    CalendarProviderId SERIAL PRIMARY KEY,
    CalendarProviderTypeId INTEGER NOT NULL,
    Name VARCHAR(100),
    Email VARCHAR(255),
    UserId INTEGER NOT NULL,
    AccessToken VARCHAR(500),
    RefreshToken VARCHAR(500),
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt TIMESTAMP,
    Scopes VARCHAR(1000),
    Salt VARCHAR(255),
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (CalendarProviderTypeId) REFERENCES CalendarProviderType(CalendarProviderTypeId) ON DELETE RESTRICT,
    FOREIGN KEY (UserId) REFERENCES "User"(UserId) ON DELETE CASCADE
);

-- Saved user locations for explicit timezone-aware generation/export.
CREATE TABLE UserLocation (
    UserLocationId SERIAL PRIMARY KEY,
    UserId INTEGER NOT NULL,
    Name VARCHAR(150) NOT NULL,
    Latitude VARCHAR(50),
    Longitude VARCHAR(50),
    Timezone VARCHAR(100) NOT NULL,
    IsDefault BOOLEAN NOT NULL DEFAULT FALSE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES "User"(UserId) ON DELETE CASCADE
);

-- -- Create Calendar table
-- CREATE TABLE Calendar (
--     CalendarId SERIAL PRIMARY KEY,
--     Name VARCHAR(255) NOT NULL,
--     IdentifierId VARCHAR(255) NOT NULL,
--     ProviderId INTEGER NOT NULL,
--     CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     Color VARCHAR(50),
--     Url VARCHAR(500),
--     FOREIGN KEY (ProviderId) REFERENCES Provider(ProviderId) ON DELETE CASCADE
-- );

-- -- Create PrayerType table
-- CREATE TABLE PrayerType (
--     PrayerTypeId SERIAL PRIMARY KEY,
--     Name VARCHAR(100) NOT NULL
-- );

-- -- Create Prayer table
-- CREATE TABLE Prayer (
--     PrayerId SERIAL PRIMARY KEY,
--     Name VARCHAR(100) NOT NULL,
--     StartTime TIMESTAMP NOT NULL,
--     EndTime TIMESTAMP NOT NULL,
--     Duration INTEGER,
--     TimeOffset INTEGER,
--     PrayerTypeId INTEGER NOT NULL,
--     Description TEXT,
--     Hide BOOLEAN NOT NULL DEFAULT FALSE,
--     CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (PrayerConfigurationId) REFERENCES PrayerConfiguration(PrayerConfigurationId) ON DELETE CASCADE,
--     FOREIGN KEY (PrayerTypeId) REFERENCES PrayerType(PrayerTypeId) ON DELETE RESTRICT
-- );

-- Create Event table
CREATE TABLE Event (
    EventId SERIAL PRIMARY KEY,
    Name VARCHAR(1024) NOT NULL,
    StartDate TIMESTAMP NULL,
    EndDate TIMESTAMP NULL,
    IsAllDay BOOLEAN NOT NULL DEFAULT FALSE,
    Description TEXT,
    Location VARCHAR(1024),
    Hide BOOLEAN NOT NULL DEFAULT FALSE,
    IsTask BOOLEAN NOT NULL DEFAULT FALSE,
    HijriMonth INTEGER,
    HijriDay INTEGER,
    DurationDays INTEGER,
    RRule VARCHAR(512) NULL,
    EventTimezone VARCHAR(100) NULL,
    Color VARCHAR(7),
    IslamicDefinitionId VARCHAR(256),
    AttributedDefinitionId VARCHAR(256),
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UserId INTEGER NULL,
    FOREIGN KEY (UserId) REFERENCES "User"(UserId) ON DELETE CASCADE
);

-- One Islamic series master per user + definition (see Sql.Migrations/002_islamic_event_masters.sql for dedup on existing DBs).
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_user_islamic_def
  ON event (userid, islamicdefinitionid)
  WHERE islamicdefinitionid IS NOT NULL;

-- User-level show/hide preferences for Islamic event definitions.
-- Stores which definitions a user has hidden in the sidebar panel.
-- The backend merges these with the base definitions from islamicEvents.json
-- when generating events or serving GET /definitions.
CREATE TABLE UserIslamicDefinitionPreference (
    UserId INTEGER NOT NULL,
    DefinitionId VARCHAR(256) NOT NULL,
    IsHidden BOOLEAN NOT NULL DEFAULT FALSE,
    DefaultColor VARCHAR(7),
    PRIMARY KEY (UserId, DefinitionId),
    FOREIGN KEY (UserId) REFERENCES "User"(UserId) ON DELETE CASCADE
);

-- Applied schema migration tracking.
CREATE TABLE IF NOT EXISTS SchemaMigration (
    MigrationId VARCHAR(255) PRIMARY KEY,
    Checksum VARCHAR(64) NOT NULL,
    AppliedAt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    AppliedBy VARCHAR(255) NOT NULL DEFAULT CURRENT_USER
);

CREATE INDEX IF NOT EXISTS idx_schemamigration_appliedat
    ON SchemaMigration (AppliedAt DESC);

-- -- Create indexes for better query performance
-- CREATE INDEX idx_provider_userid ON Provider(UserId);
-- CREATE INDEX idx_provider_type ON Provider(ProviderTypeId);
-- CREATE INDEX idx_calendar_provider ON Calendar(ProviderId);
-- CREATE INDEX idx_prayer_type ON Prayer(PrayerTypeId);
-- -- Create function to automatically update UpdatedAt timestamp
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.UpdatedAt = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Create triggers to automatically update UpdatedAt on relevant tables
-- CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON User
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_provider_updated_at BEFORE UPDATE ON Provider
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_calendar_updated_at BEFORE UPDATE ON Calendar
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_prayer_updated_at BEFORE UPDATE ON Prayer
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON Event
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default auth provider types (authentication methods)
INSERT INTO AuthProviderType (Name) VALUES 
    ('Google'),
    ('Microsoft'),
    ('Apple'),
    ('Email');

INSERT INTO SchemaMigration (MigrationId, Checksum) VALUES
    ('001_add_event_and_preference_colors', 'init-baseline'),
    ('002_add_show_arabic_event_text_to_user', 'init-baseline'),
    ('003_add_attributed_definition_id_to_event', 'init-baseline'),
    ('004_add_schema_migrations_table', 'init-baseline'),
    ('005_remove_event_type', 'init-baseline')
ON CONFLICT (MigrationId) DO NOTHING;

-- Insert default calendar provider types (calendar integration providers)
INSERT INTO CalendarProviderType (Name) VALUES 
    ('Google Calendar'),
    ('Microsoft Outlook'),
    ('Apple Calendar'),
    ('Cal.com');

-- Insert default calculation methods
INSERT INTO CalculationMethod (Name) VALUES 
    ('Muslim World League'),
    ('Islamic Society of North America'),
    ('Egyptian General Authority of Survey'),
    ('Umm Al-Qura University, Makkah'),
    ('University of Islamic Sciences, Karachi'),
    ('Institute of Geophysics, University of Tehran'),
    ('Shia Ithna-Ashari');

-- -- Insert default prayer types
-- INSERT INTO PrayerType (Name) VALUES 
--     ('Fajr'),
--     ('Sunrise'),
--     ('Dhuhr'),
--     ('Asr'),
--     ('Maghrib'),
--     ('Isha'),
--     ('Custom');

