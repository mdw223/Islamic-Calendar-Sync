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
Production: https://api.islamiccalendarsync.com/v1
Development: http://localhost:3000/api/v1
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

| Code | Meaning | Usage |
|------|---------|-------|
| **200 OK** | Success | GET, PUT, PATCH requests |
| **201 Created** | Resource created | POST requests |
| **204 No Content** | Success, no response body | DELETE requests |

### 3xx Redirection

| Code | Meaning | Usage |
|------|---------|-------|
| **304 Not Modified** | Cached response is still valid | GET requests with caching |

### 4xx Client Errors

| Code | Meaning | Usage |
|------|---------|-------|
| **400 Bad Request** | Invalid request format | Validation errors, malformed JSON |
| **401 Unauthorized** | Authentication required | Missing or invalid token |
| **403 Forbidden** | No permission | Valid auth but insufficient permissions |
| **404 Not Found** | Resource doesn't exist | Invalid resource ID |
| **409 Conflict** | Resource conflict | Duplicate email, existing resource |

### 5xx Server Errors

| Code | Meaning | Usage |
|------|---------|-------|
| **500 Internal Server Error** | Server error | Unexpected server issues |
| **503 Service Unavailable** | Service temporarily down | Maintenance, overload |

---
