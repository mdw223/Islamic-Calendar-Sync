/**
 * Keys that can be used for prototype pollution attacks.
 * These must never appear as object keys in incoming request data.
 */
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Recursively remove prototype-pollution keys from a value.
 * Mutates objects/arrays in place.
 * @param {any} value
 */
function stripDangerousKeys(value) {
  if (value === null || value === undefined) return;

  if (Array.isArray(value)) {
    value.forEach(stripDangerousKeys);
    return;
  }

  if (typeof value === "object" && value.constructor === Object) {
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key)) {
        delete value[key];
      } else {
        stripDangerousKeys(value[key]);
      }
    }
  }
}

/**
 * Middleware that strips prototype-pollution keys (__proto__, constructor,
 * prototype) from req.body, req.query, and req.params before routes run.
 * Does not touch field values — HTML fields like description are handled
 * individually at the route level via sanitizeDescription().
 */
export default function requestSanitizer(req, _res, next) {
  stripDangerousKeys(req.body);
  stripDangerousKeys(req.query);
  stripDangerousKeys(req.params);
  next();
}
