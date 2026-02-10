# API Design

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [REST Principles](#rest-principles)
- [HTTP Status Codes](#http-status-codes)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Users](#users)
  - [Settings](#settings)
  - [Providers](#providers)
  - [Calendars](#calendars)
  - [Prayer Configuration](#prayer-configuration)
  - [Prayers](#prayers)
  - [Event Configuration](#event-configuration)
  - [Events](#events)
  - [Export & Subscription](#export--subscription)
- [Request/Response Examples](#requestresponse-examples)

---

## Overview

The Islamic Calendar Sync API follows RESTful principles and uses JSON for request and response payloads. All endpoints are designed to be intuitive and follow standard HTTP conventions.

**Technology Stack:**

- Backend: Node.js
- Frontend: React
- Data Format: JSON

---

## Base URL

```
Production: https://api.islamiccalendarsync.com/
Development: http://localhost:5000/api/
```

---

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

**Token Usage:**

- Include token in the `Authorization` header: `Bearer <token>`
- Tokens expire after 24 hours
- Refresh tokens are valid for 30 days

**Guest vs Registered Users:**

- Guest users: Limited access, no authentication required
- Registered users: Full access, authentication required
- Admin users: Administrative access, authentication required with admin role

---

## REST Principles

### Resources

A **resource** is an object with associated data and operations. Resources are always **plural** in endpoints.

Examples:

- `users`, `prayers`, `events`, `calendars`

### Collections

A **collection** is a set of resources.

Examples:

- `/prayers` - collection of all prayers
- `/events` - collection of all events

### URLs

**Pattern:** `/resource` or `/resource/{id}`

**Examples:**

- `GET /prayers` - Get all prayers
- `GET /prayers/123` - Get prayer with ID 123
- `DELETE /prayers/123` - Delete prayer with ID 123

### Nested Resources

When resources belong to other resources, use nested URLs.

**Pattern:** `/parent-resource/{id}/child-resource`

**Examples:**

- `GET /users/5/prayers` - Get all prayers for user 5
- `POST /users/5/events` - Create a new event for user 5
- `GET /providers/3/calendars/12` - Get calendar 12 from provider 3

---

## HTTP Status Codes

### 2xx Success

| Code               | Meaning                   | Usage                    |
| ------------------ | ------------------------- | ------------------------ |
| **200 OK**         | Success                   | GET, PUT, PATCH requests |
| **201 Created**    | Resource created          | POST requests            |
| **204 No Content** | Success, no response body | DELETE requests          |

### 3xx Redirection

| Code                 | Meaning                        | Usage                     |
| -------------------- | ------------------------------ | ------------------------- |
| **304 Not Modified** | Cached response is still valid | GET requests with caching |

### 4xx Client Errors

| Code                 | Meaning                 | Usage                                   |
| -------------------- | ----------------------- | --------------------------------------- |
| **400 Bad Request**  | Invalid request format  | Validation errors, malformed JSON       |
| **401 Unauthorized** | Authentication required | Missing or invalid token                |
| **403 Forbidden**    | No permission           | Valid auth but insufficient permissions |
| **404 Not Found**    | Resource doesn't exist  | Invalid resource ID                     |
| **409 Conflict**     | Resource conflict       | Duplicate email, existing resource      |

### 5xx Server Errors

| Code                          | Meaning                  | Usage                    |
| ----------------------------- | ------------------------ | ------------------------ |
| **500 Internal Server Error** | Server error             | Unexpected server issues |
| **503 Service Unavailable**   | Service temporarily down | Maintenance, overload    |

---

## API Endpoints

### Authentication Endpoints

#### Register User

```
POST /auth/register
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `201 Created`

```json
{
  "userId": 1,
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_here"
}
```

---

#### Login

```
POST /auth/login
```

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`

---

#### OAuth Login

```
POST /auth/oauth/{provider}
```

**Parameters:**

- `provider`: google, outlook

**Body:**

```json
{
  "code": "oauth_authorization_code"
}
```

**Response:** `200 OK`

---

#### Refresh Token

```
POST /auth/refresh
```

**Body:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:** `200 OK`

#### Logout

```
POST /auth/logout
```

**Response:** `204 No Content`

---

### Users

#### Get Current User

```
GET /users/me
```

**Response:** `200 OK`

```json
{
  "userId": 1,
  "email": "user@example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastLogin": "2024-01-26T08:00:00Z",
  "isAdmin": false
}
```

---

#### Update Current User

```
PUT /users/me
```

**Body:**

```json
{
  "email": "newemail@example.com"
}
```

**Response:** `200 OK`

---

#### Delete Account

```
DELETE /users/me
```

**Response:** `204 No Content`

---

### Settings

#### Get User Settings

```
GET /users/{userId}/settings
```

**Response:** `200 OK`

```json
{
  "settingsId": 1,
  "userId": 1,
  "timezone": "America/New_York",
  "latitude": "35.7796",
  "longitude": "-78.6382",
  "language": "en",
  "updatedAt": "2024-01-26T10:00:00Z"
}
```

---

#### Update Settings

```
PUT /users/{userId}/settings
```

**Body:**

```json
{
  "timezone": "America/Los_Angeles",
  "latitude": "34.0522",
  "longitude": "-118.2437",
  "language": "en"
}
```

**Response:** `200 OK`

---

### Providers

#### Get All Providers for User

```
GET /users/{userId}/providers
```

**Response:** `200 OK`

```json
[
  {
    "providerId": 1,
    "providerTypeId": 1,
    "providerTypeName": "Google",
    "email": "user@gmail.com",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

#### Connect Provider (OAuth)

```
POST /users/{userId}/providers
```

**Body:**

```json
{
  "providerTypeId": 1,
  "code": "oauth_authorization_code"
}
```

**Response:** `201 Created`

---

#### Get Provider Details

```
GET /users/{userId}/providers/{providerId}
```

**Response:** `200 OK`

---

#### Disconnect Provider

```
DELETE /users/{userId}/providers/{providerId}
```

**Response:** `204 No Content`

---

#### Refresh Provider Token

```
POST /users/{userId}/providers/{providerId}/refresh
```

**Response:** `200 OK`

---

### Calendars

#### Get All Calendars for Provider

```
GET /providers/{providerId}/calendars
```

**Response:** `200 OK`

```json
[
  {
    "calendarId": 1,
    "name": "Islamic Calendar",
    "identifier": "primary",
    "color": "#039BE5",
    "url": "https://calendar.google.com/...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

---

#### Create Calendar

```
POST /providers/{providerId}/calendars
```

**Body:**

```json
{
  "name": "My Islamic Calendar",
  "color": "#D50000"
}
```

**Response:** `201 Created`

---

#### Update Calendar

```
PUT /providers/{providerId}/calendars/{calendarId}
```

**Body:**

```json
{
  "name": "Updated Calendar Name",
  "color": "#E67C73"
}
```

**Response:** `200 OK`

---

#### Delete Calendar

```
DELETE /providers/{providerId}/calendars/{calendarId}
```

**Response:** `204 No Content`

---

### Prayer Configuration

#### Get Prayer Configuration

```
GET /users/{userId}/prayer-configuration
```

**Response:** `200 OK`

```json
{
  "prayerConfigurationId": 1,
  "userId": 1,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "calculationMethodId": 2,
  "calculationMethodName": "ISNA",
  "hanafi": false,
  "updatedAt": "2024-01-26T10:00:00Z"
}
```

---

#### Create/Update Prayer Configuration

```
PUT /users/{userId}/prayer-configuration
```

**Body:**

```json
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z",
  "calculationMethodId": 2,
  "hanafi": false
}
```

**Response:** `200 OK`

---

#### Get Available Calculation Methods

```
GET /calculation-methods
```

**Response:** `200 OK`

```json
[
  {
    "calculationMethodId": 1,
    "name": "Muslim World League"
  },
  {
    "calculationMethodId": 2,
    "name": "ISNA"
  },
  {
    "calculationMethodId": 3,
    "name": "Egyptian General Authority of Survey"
  }
]
```

---

### Prayers

#### Get All Prayers for User

```
GET /users/{userId}/prayers
```

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `prayerTypeId` (optional): Filter by prayer type

**Response:** `200 OK`

```json
[
  {
    "prayerId": 1,
    "name": "Fajr",
    "startTime": "2024-01-26T05:30:00Z",
    "endTime": "2024-01-26T06:45:00Z",
    "duration": 75,
    "timeOffset": 0,
    "prayerTypeId": 1,
    "prayerTypeName": "Fard",
    "description": "The pre-dawn prayer...",
    "hide": false,
    "isCustom": false
  }
]
```

---

#### Get Single Prayer

```
GET /users/{userId}/prayers/{prayerId}
```

**Response:** `200 OK`

---

#### Create Custom Prayer

```
POST /users/{userId}/prayers
```

**Body:**

```json
{
  "name": "Tahajjud",
  "startTime": "2024-01-26T03:00:00Z",
  "endTime": "2024-01-26T04:00:00Z",
  "duration": 60,
  "timeOffset": 0,
  "prayerTypeId": 2,
  "description": "Night prayer for spiritual growth",
  "hide": false
}
```

**Response:** `201 Created`

---

#### Update Prayer

```
PUT /users/{userId}/prayers/{prayerId}
```

**Body:**

```json
{
  "duration": 90,
  "timeOffset": 10,
  "description": "Updated description",
  "hide": false
}
```

**Response:** `200 OK`

---

#### Delete Prayer

```
DELETE /users/{userId}/prayers/{prayerId}
```

**Response:** `204 No Content`

---

#### Get Prayer Types

```
GET /prayer-types
```

**Response:** `200 OK`

```json
[
  {
    "prayerTypeId": 1,
    "name": "Fard"
  },
  {
    "prayerTypeId": 2,
    "name": "Sunnah"
  },
  {
    "prayerTypeId": 3,
    "name": "Nafl"
  }
]
```

---

### Event Configuration

#### Get Event Configuration

```
GET /users/{userId}/event-configuration
```

**Response:** `200 OK`

```json
{
  "eventConfigurationId": 1,
  "userId": 1,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

---

#### Create/Update Event Configuration

```
PUT /users/{userId}/event-configuration
```

**Body:**

```json
{
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

**Response:** `200 OK`

---

### Events

#### Get All Events for User

```
GET /users/{userId}/events
```

**Query Parameters:**

- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date
- `eventTypeId` (optional): Filter by event type

**Response:** `200 OK`

```json
[
  {
    "eventId": 1,
    "name": "Ramadan Begins",
    "startDate": "2024-03-11T00:00:00Z",
    "endDate": "2024-04-09T23:59:59Z",
    "isAllDay": true,
    "description": "Month of fasting and spiritual reflection",
    "hide": false,
    "eventTypeId": 1,
    "eventTypeName": "Ramadan",
    "isCustom": false
  }
]
```

---

#### Get Single Event

```
GET /users/{userId}/events/{eventId}
```

**Response:** `200 OK`

---

#### Create Custom Event

```
POST /users/{userId}/events
```

**Body:**

```json
{
  "name": "Qur'an Reading Session",
  "startDate": "2024-01-26T19:00:00Z",
  "endDate": "2024-01-26T20:00:00Z",
  "isAllDay": false,
  "description": "Daily Qur'an reading",
  "hide": false,
  "eventTypeId": 5
}
```

**Response:** `201 Created`

---

#### Update Event

```
PUT /users/{userId}/events/{eventId}
```

**Body:**

```json
{
  "name": "Updated Event Name",
  "description": "Updated description",
  "hide": true
}
```

**Response:** `200 OK`

---

#### Delete Event

```
DELETE /users/{userId}/events/{eventId}
```

**Response:** `204 No Content`

---

#### Get Event Types

```
GET /event-types
```

**Response:** `200 OK`

```json
[
  {
    "eventTypeId": 1,
    "name": "Ramadan"
  },
  {
    "eventTypeId": 2,
    "name": "Eid"
  },
  {
    "eventTypeId": 3,
    "name": "Sunnah Fasts"
  },
  {
    "eventTypeId": 4,
    "name": "White Days"
  }
]
```

---

### Export & Subscription

#### Generate ICS File

```
POST /users/{userId}/export/ics
```

**Body:**

```json
{
  "includePrayers": true,
  "includeEvents": true,
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

**Response:** `200 OK`

```json
{
  "downloadUrl": "https://api.islamiccalendarsync.com/downloads/abc123.ics",
  "expiresAt": "2024-01-26T12:00:00Z"
}
```

---

#### Create Calendar Subscription URL

```
POST /users/{userId}/subscriptions
```

**Body:**

```json
{
  "name": "My Islamic Calendar",
  "includePrayers": true,
  "includeEvents": true
}
```

**Response:** `201 Created`

```json
{
  "subscriptionId": 1,
  "name": "My Islamic Calendar",
  "url": "webcal://api.islamiccalendarsync.com/subscriptions/abc123",
  "createdAt": "2024-01-26T10:00:00Z"
}
```

---

#### Get User Subscriptions

```
GET /users/{userId}/subscriptions
```

**Response:** `200 OK`

---

#### Delete Subscription

```
DELETE /users/{userId}/subscriptions/{subscriptionId}
```

**Response:** `204 No Content`

---

#### Sync to Calendar Provider

```
POST /users/{userId}/sync
```

**Body:**

```json
{
  "providerId": 1,
  "calendarId": 1,
  "includePrayers": true,
  "includeEvents": true
}
```

**Response:** `200 OK`

```json
{
  "prayersCreated": 1825,
  "eventsCreated": 45,
  "syncedAt": "2024-01-26T10:30:00Z"
}
```

---

## Request/Response Examples

### Info Log Response Format

Info logs responses follow this structure:

```json
{
  "log": {
    "info": "Created new user [Success: true] [StatusCode: 201]",
    "source": "UserService.createUser",
    "userId": 1,
    "data": [
      {
        "userId": 1,
        "email": "user@example.com",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "refresh_token_here"
      }
    ]
  }
}
```

### Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "info": "VALIDATION_ERROR [Success: false] [StatusCode: 400]",
    "source": "UserService.createUser",
    "userId": 1,
    "errorMessage": "Invalid request data",
    "data": [
      {
        "userId": 1,
        "email": "user@example.com",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "refresh_token_here"
      }
    ]
  }
}
```

### Common Error Codes

| Code               | HTTP Status | Description               |
| ------------------ | ----------- | ------------------------- |
| `VALIDATION_ERROR` | 400         | Request validation failed |
| `UNAUTHORIZED`     | 401         | Authentication required   |
| `FORBIDDEN`        | 403         | Insufficient permissions  |
| `NOT_FOUND`        | 404         | Resource not found        |
| `CONFLICT`         | 409         | Resource already exists   |
| `INTERNAL_ERROR`   | 500         | Server error              |

---

### Pagination

For endpoints returning lists, use query parameters:

```
GET /users/{userId}/prayers?page=1&limit=50
```

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1825,
    "totalPages": 37
  }
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All requests and responses use `application/json` content type
- Rate limiting: 1000 requests per hour per user
- Guest users have limited rate: 100 requests per hour per IP
- HTTPS is required for all requests in production
