/**
 * Keys that must never be sent to the client. Removed recursively from res.json() bodies.
 */
const REDACT_KEYS = new Set([
  "salt",
  "password",
  "accessToken",
  "refreshToken",
  "accesstoken",
  "refreshtoken"
]);

/**
 * Recursively remove redacted keys from a value. Mutates the object in place.
 * @param {any} value
 * @returns {any} The same value (objects/arrays mutated in place)
 */
function sanitize(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => sanitize(item));
    return value;
  }

  if (typeof value === "object" && value.constructor === Object) {
    for (const key of Object.keys(value)) {
      if (REDACT_KEYS.has(key)) {
        delete value[key];
      } else {
        sanitize(value[key]);
      }
    }
    return value;
  }

  return value;
}

/**
 * Middleware that wraps res.json so response bodies are sanitized (redacted keys removed)
 * before being sent. Apply before your routes so all res.json() calls are filtered.
 */
export default function responseSanitizer(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body !== null && typeof body === "object") {
      sanitize(body);
    }
    return originalJson(body);
  };
  next();
}
