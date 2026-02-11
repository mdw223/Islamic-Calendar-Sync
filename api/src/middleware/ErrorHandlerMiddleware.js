import { defaultLogger, extractUserId, sanitizeForLog } from "./Logger.js";

function normalizeStatusCode(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 500;
  if (n < 400) return 500;
  if (n > 599) return 500;
  return n;
}

function getSafeClientMessage(statusCode, err) {
  // Only allow explicitly-marked safe messages for 4xx errors.
  if (statusCode < 500) {
    if (typeof err?.publicMessage === "string" && err.publicMessage.trim()) {
      return err.publicMessage;
    }
    if (err?.expose === true && typeof err?.message === "string" && err.message.trim()) {
      return "Request failed";
    }

    switch (statusCode) {
      case 400:
        return "Bad Request";
      case 401:
        return "Unauthorized";
      case 403:
        return "Forbidden";
      case 404:
        return "Not Found";
      case 409:
        return "Conflict";
      case 422:
        return "Unprocessable Entity";
      case 429:
        return "Too Many Requests";
      default:
        return "Request failed";
    }
  }

  return "Internal Server Error";
}

export default function ErrorHandlerMiddleware(err, req, res, next) {
  const statusCode = normalizeStatusCode(err?.statusCode ?? err?.status ?? 500);
  const requestId = req?.requestId;

  try {
    defaultLogger.error("request_error", {
      requestId,
      statusCode,
      method: req?.method,
      path: req?.originalUrl?.split("?")[0],
      userId: extractUserId(req),
      ip: req?.ip,
      userAgent: req?.get?.("user-agent"),
      query: sanitizeForLog(req?.query),
      body: sanitizeForLog(req?.body),
      error: {
        name: err?.name,
        message: err?.message,
        code: err?.code,
        stack: err?.stack,
      },
    });
  } catch (logErr) {
    // Never let logging failures impact error responses.
    console.error("Failed to log error:", logErr?.message || logErr);
  }

  const message = getSafeClientMessage(statusCode, err);

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      requestId,
    },
  });
}
