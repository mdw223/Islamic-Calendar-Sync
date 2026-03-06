/**
 * Serialize payloads explicitly through JSON.stringify before writing responses.
 * This also triggers model toJSON() methods so only intended fields are emitted.
 * Recursively processes the payload to call toJSON() on any objects that define it.
 * @param {import('express').Response} res
 * @param {any} payload
 * @param {number} [statusCode=200]
 */
export function sendJson(res, payload, statusCode = 200) {
  // Recursively process payload to call toJSON() where it exists
  const processPayload = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    // If the object has a toJSON method, call it
    if (typeof obj === 'object' && typeof obj.toJSON === 'function') {
      return obj.toJSON();
    }
    
    // If it's an array, process each element
    if (Array.isArray(obj)) {
      return obj.map(processPayload);
    }
    
    // If it's a plain object, recursively process each value
    if (obj.constructor === Object) {
      const processed = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          processed[key] = processPayload(obj[key]);
        }
      }
      return processed;
    }
    
    // For primitives and other types, return as-is
    return obj;
  };
  
  const processedPayload = processPayload(payload);
  return res
    .status(statusCode)
    .type("application/json")
    .send(JSON.stringify(processedPayload));
}
