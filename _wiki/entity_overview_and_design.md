# Entity Overview and Design

## Table of Contents

- [[1. General Overview](https://claude.ai/chat/156e7e6c-7595-490b-948e-9463f83a26f1#1-general-overview)](#1-general-overview)
- [[2. Core Entities](https://claude.ai/chat/156e7e6c-7595-490b-948e-9463f83a26f1#2-core-entities)](#2-core-entities)
- [[3. Entity Relationship Diagram](https://claude.ai/chat/156e7e6c-7595-490b-948e-9463f83a26f1#3-entity-relationship-diagram)](#3-entity-relationship-diagram)
- [[4. Entity Interaction Flow](https://claude.ai/chat/156e7e6c-7595-490b-948e-9463f83a26f1#4-entity-interaction-flow)](#4-entity-interaction-flow)
- [[5. User Roles and Permissions](https://claude.ai/chat/156e7e6c-7595-490b-948e-9463f83a26f1#5-user-roles-and-permissions)](#5-user-roles-and-permissions)

---

## 1. General Overview

Islamic Calendar Sync is designed to help users generate and customize prayer times and Islamic events to help them prioritize their faith with their busy schedules. The system revolves around several core entities that interact to provide a seamless user experience.

<img width="2967" height="546" alt="ICS ER diagram" src="https://github.com/user-attachments/assets/cbf5c8c1-9f94-4e1e-bc92-acfb051ff715" />

[Link to Lucid ERD](https://lucid.app/lucidchart/87773400-ec8c-428c-81de-9944dd3b9ef5/edit?viewport_loc=261%2C773%2C4099%2C1568%2C0_0&invitationId=inv_48e52ce0-ccbe-4a0a-bef9-8a656b1e0510)

---

## 2. Core Entities

### Users

Can login via email or OAuth, configure settings, generate personal Islamic calendar events and prayer times to their calendar provider.
Users contain an event configuration such as the range of dates to add Islamic calendar events. Users can specify start and end dates for the range they want to add holidays in their calendar provider.
Users contains settings such as the language and geographic settings to determine prayer time accuracy. Always asks the user to put current location and language to check if they want to change it.
Users contain a prayer configuration for specifying the range for which to generate prayer times, method of Asr calculation, method of prayer time calculation (Hanafi), and other configuration options.

### Provider

The calendar provider a user uses for OAuth or creating events via API. Includes tokens, email, etc. A user is not required to have a calendar provider unless they want to use OAuth or use the API to create events.

### ProviderType

The type of calendar provider like Google, Outlook, etc. (enum).

### Calendar

The calendar identifier in their calendar provider and have the credential so that if they save events, then it can go in their calendar provider. Users can make a calendar and have other users add events to it, but only they can make updates in the app and they can persist their calendar provider.

### CalculationMethod

The method of calculating prayer times such as per the Islamic Society of North America (ISNA), Muslim World League, Egyptian General Authority of Survey, etc. (enum).

### Prayer

Prayer time, duration, offset, description with virtues, type of prayer. Can be customized by users. Users can also make custom prayers.

### PrayerType

All the types of prayers as enum (Sunnah, Fard, Taraweeh, etc.).

### Event

An Islamic calendar event or task that has start and end date, description with virtues that are customizable. This can be Sunnah fasts, Ramadan, white days, etc. Users can customize these events, and they can save them to the back end. Users can also make custom events like Qur'an.

### EventType

The type of Islamic event like Sunnah Fasts, Ramadan, White Days, Eid, etc. (enum).

### Log

Server-side application logs (requests, responses, and errors) persisted in Postgres for troubleshooting and auditing. Sensitive fields (tokens, cookies, secrets, passwords) are redacted and request bodies/query strings are sanitized and truncated. Log contents are not returned to clients.

---

## 3. Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        int UserId PK
        string Email UK
        string Name
        datetime CreatedAt
        datetime UpdatedAt
        datetime LastLogin
        bit IsAdmin
        varchar Language
        datetime EventConfigurationStart
        datetime EventConfigurationEnd
        datetime PrayerConfigurationStart
        datetime PrayerConfigurationEnd
        int CalculationMethodId FK
        bit Hanafi
        varchar Salt
        bit EmailUpdates
        bit Notifications
    }

    LOCATION {
        int LocationId PK
        varchar Latitude
        varchar Longitude
        varchar Timezone
        int UserId FK
    }

    PROVIDER {
        int ProviderId PK
        int ProviderTypeId FK
        varchar Email
        int UserId FK
        datetime CreatedAt
        datetime UpdatedAt
        datetime ExpiresAt
        varchar AccessToken
        varchar Scopes
        varchar Salt
        varchar RefreshToken
        bit IsActive
    }

    PROVIDER_TYPE {
        int ProviderTypeId PK
        varchar Name
    }

    CALENDAR {
        int CalendarId PK
        varchar Name
        varchar IdentifierId
        int ProviderId FK
        datetime CreatedAt
        datetime UpdatedAt
        varchar Color
        varchar Url
    }

    CALCULATION_METHOD {
        int CalculationMethodId PK
        varchar Name
    }

    PRAYER {
        int PrayerId PK
        varchar Name
        datetime StartTime
        datetime EndTime
        int Duration
        int TimeOffset
        int PrayerTypeId FK
        varchar Description
        bit Hide
        bit IsCustom
        datetime CreatedAt
        datetime UpdatedAt
    }

    PRAYER_TYPE {
        int PrayerTypeId PK
        varchar Name
    }

    EVENT {
        int EventId PK
        varchar Name
        datetime StartDate
        datetime EndDate
        bit IsAllDay
        varchar Description
        bit Hide
        int EventTypeId FK
        bit IsCustom
        bit IsTask
        datetime CreatedAt
        datetime UpdatedAt
    }

    EVENT_TYPE {
        int EventTypeId PK
        varchar Name
    }

    LOG {
        int LogId PK
        datetime Timestamp
        varchar Level
        varchar Message
        varchar Logger
        string RequestId
        int UserId FK
        varchar HttpMethod
        varchar Path
        int StatusCode
        int DurationMs
        varchar Ip
        varchar UserAgent
        varchar ErrorCode
        varchar ErrorStack
        string Meta
    }

    USERS ||--o{ PROVIDER : "connects to"
    USERS ||--o{ LOCATION : "contains"
    PROVIDER }o--|| PROVIDER_TYPE : "is type"
    PROVIDER ||--o{ CALENDAR : "contains"
    USERS }o--|| CALCULATION_METHOD : "uses"
    USERS ||--o{ PRAYER : "generates"
    PRAYER }o--|| PRAYER_TYPE : "is type"
    USERS ||--o{ EVENT : "generates"
    EVENT }o--|| EVENT_TYPE : "is type"
    USERS ||--o{ LOG : "produces"
```

---

## 4. Entity Interaction Flow

1. **User** authenticates and creates/updates their profile, optionally connecting with a **Provider**, then specifies language and location in **Settings**.

2. **User** triggers calendar generation which creates **Prayer** times and **Event** entries based on their configurations.

3. **User** can preview **Prayer** times and **Events** before final export.

4. Islamic calendar events from **Event** and prayer times from **Prayer** are exported to their **Calendar** via **Provider**.

---

## 5. User Roles and Permissions

### Guest User

**Description**: Unauthenticated user with limited features and temporary data storage.

**Permissions**:

- Can configure settings, event and prayer configurations temporarily
- Can generate and edit prayer times and Islamic calendar events
- Preview calendar generation (but not with calendar provider events)
- Download ICS files (limited to current session)
- Generate a URL for calendar subscription
- **Cannot** save settings or create custom events permanently

---

### Registered User

**Description**: Authenticated user with full access to personal features with persistence.

**Permissions**:

- Everything Guest User can do
- Save prayer settings permanently
- Create and manage custom events and prayers
- Create calendar subscriptions
- Preview calendar with the events from their provider for scheduling
- Connect to calendar providers via OAuth
- Access personal dashboard and history
- Persist all configurations and customizations

---

### Admin User

**Description**: System administrator with management capabilities.

**Permissions**:

- Everything Registered User can do
- Add/edit/delete default Islamic events and prayer times
- View user analytics and usage statistics
- Manage user accounts and permissions
- Monitor system performance and errors
- Update calculation methods and formulas
- Manage calendar provider integrations
- Export system data and reports
- Access admin dashboard with system-wide controls

---

## Notes

- **Flexibility**: Users can choose to use the system without connecting a calendar provider by downloading ICS files or using subscription URLs.
- **Customization**: Both prayers and events can be customized with descriptions, times, and visibility settings.
- **Privacy**: Guest users have temporary storage, while registered users have persistent, secure storage of their preferences.
- **Scalability**: The enum-based approach for types allows easy addition of new prayer types, event types, and provider types.
