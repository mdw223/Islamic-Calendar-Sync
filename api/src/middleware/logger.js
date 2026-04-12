import crypto from "node:crypto";
import winston from "winston";
import Transport from "winston-transport";
import { query as dbQuery } from "../model/db/DBConnection.js";
import { logConfig } from "../Config.js";

/**
 * Logging levels examples: logger.info('message'), logger.error('message'), logger.warn('message'), logger.debug('message'), logger.verbose('message'), logger.silly('message')
 * How to log with custom format: logger.info({ message: 'message', userId: 'userId', className: 'className', methodName: 'methodName', ...rest })
 * How to Log with error: logger.error(new Error('error message'), { userId: 'userId', className: 'className', methodName: 'methodName', ...rest })
 * How to in other files: 
 * import { defaultLogger, customLogger } from './Logger.js';
 * defaultLogger.info('message');
 */

const REDACTED = "[REDACTED]";
const MAX_STRING_LENGTH = 2048;
const MAX_OBJECT_KEYS = 200;
const MAX_ARRAY_LENGTH = 200;
const MAX_DEPTH = 6;

const SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "pass",
  "pwd",
  "secret",
  "client_secret",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "api_key",
  "apikey",
  "x-api-key",
  "session",
];

function isSensitiveKey(key) {
  if (!key) return false;
  const k = String(key).toLowerCase();
  return SENSITIVE_KEYS.includes(k) || k.includes("token") || k.includes("secret") || k.includes("password");
}

function truncateString(value) {
  if (typeof value !== "string") return value;
  if (value.length <= MAX_STRING_LENGTH) return value;
  return `${value.slice(0, MAX_STRING_LENGTH)}…(truncated)`;
}

export function sanitizeForLog(value, depth = 0, seen = new WeakSet()) {
  if (value == null) return value;
  if (depth > MAX_DEPTH) return "[MaxDepth]";

  if (typeof value === "string") return truncateString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();

  // Errors: preserve safe shape (stack is stored separately in DB row where applicable)
  if (value instanceof Error) {
    return {
      name: value.name,
      message: truncateString(value.message),
      code: value.code,
      stack: truncateString(value.stack),
    };
  }

  if (Array.isArray(value)) {
    const out = [];
    const len = Math.min(value.length, MAX_ARRAY_LENGTH);
    for (let i = 0; i < len; i += 1) out.push(sanitizeForLog(value[i], depth + 1, seen));
    if (value.length > len) out.push(`[+${value.length - len} more]`);
    return out;
  }

  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    const entries = Object.entries(value);
    const limited = entries.slice(0, MAX_OBJECT_KEYS);
    const out = {};
    for (const [k, v] of limited) {
      out[k] = isSensitiveKey(k) ? REDACTED : sanitizeForLog(v, depth + 1, seen);
    }
    if (entries.length > limited.length) out.__truncatedKeys = entries.length - limited.length;
    return out;
  }

  return String(value);
}

export function extractUserId(req) {
  const u = req?.user;
  return u?.UserId ?? u?.userId ?? u?.id ?? u?.sub ?? null;
}

function safePath(req) {
  const original = req?.originalUrl || req?.url || "";
  return String(original).split("?")[0];
}

class PostgresTransport extends Transport {
  constructor(options = {}) {
    super(options);
    this.enabled = options.enabled ?? logConfig.LOG_QUERIES;
    this.flushIntervalMs = options.flushIntervalMs ?? 1000;
    this.batchSize = options.batchSize ?? 50;
    this.maxQueueSize = options.maxQueueSize ?? 2000;

    this.queue = [];
    this.flushing = false;

    if (this.enabled) {
      this.timer = setInterval(() => void this.flush(), this.flushIntervalMs);
      // Allow the process to exit naturally.
      this.timer.unref?.();
    }
  }

  log(info, callback) {
    setImmediate(() => this.emit("logged", info));

    if (!this.enabled) {
      callback?.();
      return;
    }

    // Avoid runaway memory usage if DB is down.
    if (this.queue.length >= this.maxQueueSize) {
      this.queue.shift();
    }

    this.queue.push({ ...info });

    if (this.queue.length >= this.batchSize) {
      void this.flush();
    }

    callback?.();
  }

  async flush() {
    if (!this.enabled) return;
    if (this.flushing) return;
    if (this.queue.length === 0) return;

    this.flushing = true;
    try {
      const batch = this.queue.splice(0, this.batchSize);
      for (const info of batch) {
        await this.insertOne(info);
      }
    } catch (err) {
      // Never recurse into Winston from a transport.
      console.error("PostgresTransport flush error:", err?.message || err);
    } finally {
      this.flushing = false;
    }
  }

  async insertOne(info) {
    const timestamp = info.timestamp ? new Date(info.timestamp) : new Date();
    const level = info.level || "info";
    const message =
      typeof info.message === "string" ? info.message : truncateString(JSON.stringify(sanitizeForLog(info.message)));

    const logger = info.logger ?? info.loggerName ?? null;
    const requestId = info.requestId ?? null;
    const userId = info.userId ?? null;
    const httpMethod = info.method ?? info.httpMethod ?? null;
    const path = info.path ?? null;
    const statusCode = Number.isFinite(Number(info.statusCode)) ? Number(info.statusCode) : null;
    const durationMs = Number.isFinite(Number(info.durationMs)) ? Number(info.durationMs) : null;
    const ip = info.ip ?? null;
    const userAgent = info.userAgent ?? null;

    const errorCode = info?.error?.code ?? info.code ?? null;
    const errorStack = info?.error?.stack ?? info.stack ?? null;

    // Store "everything else" in Meta (sanitized).
    // Omit common Winston symbols and our top-level fields.
    const {
      level: _level,
      message: _message,
      timestamp: _timestamp,
      logger: _logger,
      loggerName: _loggerName,
      requestId: _requestId,
      userId: _userId,
      method: _method,
      httpMethod: _httpMethod,
      path: _path,
      statusCode: _statusCode,
      durationMs: _durationMs,
      ip: _ip,
      userAgent: _userAgent,
      error: _error,
      stack: _stack,
      code: _code,
      ...rest
    } = info;

    const meta = sanitizeForLog(rest);

    const sql = `
      INSERT INTO Log
        (Timestamp, Level, Message, Logger, RequestId, UserId, HttpMethod, Path, StatusCode, DurationMs, Ip, UserAgent, ErrorCode, ErrorStack, Meta)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
    `;

    await dbQuery(sql, [
      timestamp,
      level,
      message,
      logger,
      requestId,
      userId,
      httpMethod,
      path,
      statusCode,
      durationMs,
      ip,
      truncateString(userAgent),
      errorCode,
      truncateString(errorStack),
      JSON.stringify(meta ?? {}),
    ]);
  }
}

const baseFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const defaultLogger = winston.createLogger({
  level: logConfig.LEVEL,
  format: baseFormat,
  defaultMeta: { logger: "default" },
  transports: [
    new winston.transports.Console(),
    new PostgresTransport({ level: logConfig.LEVEL }),
  ],
});

export const customLogger = defaultLogger.child({ logger: "custom" });

/**
 * Express request logging middleware (default export).
 * Adds `req.requestId` and emits structured logs with redaction.
 */
export default function requestLogger(req, res, next) {
  const requestId = req?.headers?.["x-request-id"] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  const start = Date.now();
  const userId = extractUserId(req);
  const path = safePath(req);

  defaultLogger.info("http_request_start", {
    requestId,
    userId,
    method: req.method,
    path,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    query: sanitizeForLog(req.query),
    body: sanitizeForLog(req.body),
  });

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    defaultLogger.info("http_request_end", {
      requestId,
      userId,
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}