/**
 * ApiErrorHelper.js
 *
 * Classifies API errors so callers can decide whether to fall back
 * to IndexedDB (OfflineClient) or surface the error to the user.
 *
 * Two categories trigger an offline fallback:
 *   1. Network failure — fetch threw a TypeError (no connectivity).
 *   2. Auth failure   — server returned 401 or 403 (not authenticated).
 *
 * In both cases the operation should be cached locally in IndexedDB
 * and synced to the server on the next successful login.
 */

export function isOfflineError(err) {
  if (!navigator.onLine) return true;
  return err instanceof TypeError;
}

export function isAuthError(err) {
  return err?.status === 401 || err?.status === 403;
}

export function shouldFallbackToOffline(err) {
  return isOfflineError(err) || isAuthError(err);
}
