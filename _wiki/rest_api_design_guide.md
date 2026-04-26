# API Design

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Current Endpoints](#current-endpoints)
  - [Health](#health)
  - [Auth](#auth)
  - [Users](#users)
  - [Events](#events)
  - [Definitions](#definitions)
  - [User Locations](#user-locations)
  - [Subscriptions](#subscriptions)
  - [Calendar Providers](#calendar-providers)
  - [Contact](#contact)
- [HTTP Status Codes](#http-status-codes)
- [Notes](#notes)

---

## Overview

The Islamic Calendar Sync API is a REST-style Express API that serves the React frontend and calendar subscription clients.

---

## Base URL

```text
Development: http://localhost:5000/api
Production:  https://api.yourdomain.com/api
```

---

## Authentication

- App authentication uses JWT validated by `passport-jwt`.
- Browser flow: JWT is set in cookie `token` (secure httpOnly in production).
- API clients can also send `Authorization: Bearer <token>`.
- Route authorization is enforced by `Auth(...)` middleware.
- Subscription feed endpoint uses separate token validation (`?token=`), not login JWT.

---

## Current Endpoints

### Health

- `GET /health`
- `GET /health/db`

### Auth

- `GET /auth/google/login`
- `GET /auth/google/redirect`
- `POST /auth/magiclink/send`
- `GET /auth/magiclink/verify`
- `GET /login/check-email`

> Microsoft/Apple strategies are implemented but routes are currently commented out in `api/src/endpoints/Routes.js`.

### Users

- `GET /users/me`
- `PUT /users/me`
- `DELETE /users/me`
- `POST /users/logout`
- `GET /users/:userId` (same-user/admin policy)

### Events

- `GET /events`
- `GET /events.ics`
- `POST /events`
- `GET /events/:eventId`
- `PUT /events/:eventId`
- `DELETE /events/:eventId`
- `DELETE /events`
- `POST /events/generate`
- `POST /events/islamic/reset`
- `POST /events/sync`

### Definitions

- `GET /definitions`
- `PUT /definitions/:definitionId`
- `POST /definitions/sync`

### User Locations

- `GET /user-locations`
- `POST /user-locations`
- `PUT /user-locations/:userLocationId`
- `DELETE /user-locations/:userLocationId`
- `POST /user-locations/sync`

### Subscriptions

- Public feed:
  - `GET /subscription/events?token=<subscription-token>`
- Management:
  - `GET /subscription/urls`
  - `POST /subscription`
  - `PUT /subscription/:subscriptionTokenId`
  - `POST /subscription/revoke`

### Calendar Providers

- `GET /calendar-providers`

### Contact

- `POST /contact`

---

## HTTP Status Codes

- `200 OK` successful reads/updates
- `201 Created` resource creation (where applicable)
- `204 No Content` successful deletions
- `400 Bad Request` validation error
- `401 Unauthorized` missing/invalid auth (route dependent)
- `403 Forbidden` auth valid but insufficient permission
- `404 Not Found` route/resource not found
- `409 Conflict` uniqueness/resource conflict
- `500 Internal Server Error` unexpected failure

---

## Notes

- Responses are sanitized by `ResponseSanitizer`.
- Requests are hardened by `RequestSanitizer`.
- Global rate limiting is applied, backed by Redis in production.
- In split-hosting deployments, CORS allowlist must include frontend origin(s) via `CORS_ALLOWED_ORIGINS`.
