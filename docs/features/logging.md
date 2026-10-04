## Logging Implementation

This document describes how logging is implemented in the API using `winston` and a custom Postgres transport.  
The goals are to have consistent, structured logs, protect sensitive data, and make it easy to correlate logs with individual HTTP requests.

### High‑level design

- **Library**: all logging is built on top of `winston`.
- **Central logger**: a shared logger instance is created in one place and reused everywhere.
- **Transports**:
  - Console transport for local development and quick inspection.
  - Custom Postgres transport that writes log events to the `Log` table asynchronously.
- **Structure**: logs are JSON-like objects with a message, level, timestamp, and metadata (request info, user info, error details, etc.).

### Request correlation

- Each incoming HTTP request is assigned a **`requestId`** using `crypto.randomUUID()`.
- The `requestId` is attached to:
  - `req.requestId` for use throughout the request pipeline.
  - A response header (e.g., `X-Request-Id`) so clients can reference it when reporting issues.
- Every log line related to that request includes the same `requestId`, allowing end‑to‑end tracing.

### Request/response logging

- A `Logger` middleware wraps each request:
  - Logs a **start** event with method, path, sanitized query/body, IP, and user‑agent.
  - Logs a **completion** event with status code and duration in milliseconds.
- The middleware is the default export from `api/src/middleware/Logger.js` so it can be plugged directly into `index.js`.
- Timing is captured using high‑resolution timers; duration is stored as `DurationMs` in the `Log` table.

### Redaction and payload safety

- A redaction utility cleans incoming data before it is logged:
  - Removes or masks sensitive keys such as `authorization`, `cookie`, `set-cookie`, `password`, `token`, `access_token`, `refresh_token`, `client_secret` (case‑insensitive).
  - Limits depth and total size of objects to avoid huge log records and unbounded recursion.
- Only the sanitized versions of `headers`, `query`, and `body` are ever written to logs.
- This applies both to request logs and to error logs.

### Error handling and client responses

- The `ErrorHandlerMiddleware` is responsible for:
  - Logging server‑side details: message, stack trace, error name, `requestId`, and any useful metadata.
  - Ensuring sensitive information (passwords, tokens, raw request bodies, etc.) is not included.
- Client responses never contain stack traces.
- Error messages follow a **safe‑by‑default** policy:
  - For 5xx errors, clients receive a generic message plus the `requestId`.
  - For 4xx errors, only curated “public” messages are returned (e.g., via `err.publicMessage` or `err.expose === true`).

### Postgres `Log` table

- All persistent logging is written into a `Log` table via the custom transport.
- The table includes fields such as:
  - `LogId`, `Timestamp`, `Level`, `Message`, `Logger`
  - `RequestId`, optional `UserId`
  - `HttpMethod`, `Path`, `StatusCode`, `DurationMs`
  - `Ip`, `UserAgent`
  - `ErrorCode`, `ErrorStack`
  - `Meta` (JSONB for arbitrary structured context)
- Indexes on timestamp, level, `RequestId`, and `UserId` support debugging and reporting.

### Postgres Winston transport

- A custom transport extends `winston-transport` and uses the shared DB connection from `DBConnection`.
- Log events are enqueued and inserted asynchronously:
  - Logging never blocks the main request/response path.
  - On failures, the transport logs to console and drops/bounds the queue to prevent cascading outages.
- The transport is registered as one of the logger’s transports at startup.

### DB and internal logging

- `DBConnection` replaces `console.log` with the shared logger.
- Normal query execution logs:
  - High‑level metadata (duration, row count, and a short operation name).
  - No raw parameters or full SQL at `info` level.
- More detailed SQL logging, if enabled, is restricted to a `debug` level and is still subject to redaction rules.

### Wiki and ERD updates

- The `Log` entity is documented in the ERD with its relationship to `Users` (optional FK).
- The description emphasizes:
  - Structured, queryable logs.
  - Strict redaction of secrets and sensitive user data.
  - Use of `requestId` to correlate application behavior and client‑reported issues.