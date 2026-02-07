-- Initialize Database Schema for PostgreSQL
-- This script creates all tables for the prayer and event management system

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS Event CASCADE;
DROP TABLE IF EXISTS EventType CASCADE;
DROP TABLE IF EXISTS Prayer CASCADE;
DROP TABLE IF EXISTS PrayerType CASCADE;
DROP TABLE IF EXISTS CalculationMethod CASCADE;
DROP TABLE IF EXISTS Calendar CASCADE;
DROP TABLE IF EXISTS Provider CASCADE;
DROP TABLE IF EXISTS ProviderType CASCADE;
DROP TABLE IF EXISTS Settings CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Create Users table
CREATE TABLE Users (
    UserId SERIAL PRIMARY KEY,
    Email VARCHAR(255) NOT NULL UNIQUE,
    CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastLogin TIMESTAMP,
    IsAdmin BOOLEAN NOT NULL DEFAULT FALSE
    Timezone VARCHAR(100),
    Latitude VARCHAR(50),
    Longitude VARCHAR(50),
    Language VARCHAR(10),
    EventConfigurationStart TIMESTAMP NOT NULL,
    EventConfigurationEnd TIMESTAMP NOT NULL,
    PrayerConfigurationStart TIMESTAMP NOT NULL,
    PrayerConfigurationEnd TIMESTAMP NOT NULL,
    CalculationMethodId INTEGER NOT NULL,
    Hanafi BOOLEAN NOT NULL DEFAULT FALSE,
    Salt VARCHAR(255),
    FOREIGN KEY (CalculationMethodId) REFERENCES CalculationMethod(CalculationMethodId) ON DELETE RESTRICT
);

-- Create CalculationMethod table
CREATE TABLE CalculationMethod (
    CalculationMethodId SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);

-- -- Create ProviderType table
-- CREATE TABLE ProviderType (
--     ProviderTypeId SERIAL PRIMARY KEY,
--     Name VARCHAR(100) NOT NULL
-- );

-- -- Create Provider table
-- CREATE TABLE Provider (
--     ProviderId SERIAL PRIMARY KEY,
--     ProviderTypeId INTEGER NOT NULL,
--     Email VARCHAR(255),
--     UserId INTEGER NOT NULL,
--     AccessToken VARCHAR(500),
--     RefreshToken VARCHAR(500),
--     CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     ExpiresAt TIMESTAMP,
--     Scopes VARCHAR(1000),
--     Salt VARCHAR(255),
--     IsActive BOOLEAN NOT NULL DEFAULT TRUE,
--     FOREIGN KEY (ProviderTypeId) REFERENCES ProviderType(ProviderTypeId) ON DELETE RESTRICT,
--     FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE
-- );

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
--     IsCustom BOOLEAN NOT NULL DEFAULT FALSE,
--     CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (PrayerConfigurationId) REFERENCES PrayerConfiguration(PrayerConfigurationId) ON DELETE CASCADE,
--     FOREIGN KEY (PrayerTypeId) REFERENCES PrayerType(PrayerTypeId) ON DELETE RESTRICT
-- );

-- -- Create EventType table
-- CREATE TABLE EventType (
--     EventTypeId SERIAL PRIMARY KEY,
--     Name VARCHAR(100) NOT NULL
-- );

-- -- Create Event table
-- CREATE TABLE Event (
--     EventId SERIAL PRIMARY KEY,
--     Name VARCHAR(255) NOT NULL,
--     StartDate TIMESTAMP NOT NULL,
--     EndDate TIMESTAMP NOT NULL,
--     IsAllDay BOOLEAN NOT NULL DEFAULT FALSE,
--     Description TEXT,
--     Hide BOOLEAN NOT NULL DEFAULT FALSE,
--     EventTypeId INTEGER NOT NULL,
--     IsCustom BOOLEAN NOT NULL DEFAULT FALSE,
--     IsTask BOOLEAN NOT NULL DEFAULT FALSE,
--     CreatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     UpdatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (EventConfigurationId) REFERENCES EventConfiguration(EventConfigurationId) ON DELETE CASCADE,
--     FOREIGN KEY (EventTypeId) REFERENCES EventType(EventTypeId) ON DELETE RESTRICT
-- );

-- -- Create indexes for better query performance
-- CREATE INDEX idx_provider_userid ON Provider(UserId);
-- CREATE INDEX idx_provider_type ON Provider(ProviderTypeId);
-- CREATE INDEX idx_calendar_provider ON Calendar(ProviderId);
-- CREATE INDEX idx_prayer_type ON Prayer(PrayerTypeId);
-- CREATE INDEX idx_event_type ON Event(EventTypeId);

-- -- Create function to automatically update UpdatedAt timestamp
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.UpdatedAt = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Create triggers to automatically update UpdatedAt on relevant tables
-- CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_provider_updated_at BEFORE UPDATE ON Provider
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_calendar_updated_at BEFORE UPDATE ON Calendar
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_prayer_updated_at BEFORE UPDATE ON Prayer
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON Event
--     FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -- Insert default provider types
-- INSERT INTO ProviderType (Name) VALUES 
--     ('Google Calendar'),
--     ('Microsoft Outlook'),
--     ('Apple Calendar');

-- -- Insert default calculation methods
-- INSERT INTO CalculationMethod (Name) VALUES 
--     ('Muslim World League'),
--     ('Islamic Society of North America'),
--     ('Egyptian General Authority of Survey'),
--     ('Umm Al-Qura University, Makkah'),
--     ('University of Islamic Sciences, Karachi'),
--     ('Institute of Geophysics, University of Tehran'),
--     ('Shia Ithna-Ashari');

-- -- Insert default prayer types
-- INSERT INTO PrayerType (Name) VALUES 
--     ('Fajr'),
--     ('Sunrise'),
--     ('Dhuhr'),
--     ('Asr'),
--     ('Maghrib'),
--     ('Isha'),
--     ('Custom');

-- -- Insert default event types
-- INSERT INTO EventType (Name) VALUES 
--     ('Ramadan'),
--     ('Eid'),
--     ('Jumah'),
--     ('Custom');