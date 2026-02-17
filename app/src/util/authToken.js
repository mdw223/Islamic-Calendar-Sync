const STORAGE_KEY = "auth_token";

/**
 * Get the stored JWT. Used by HttpClient to send Authorization: Bearer.
 */
export function getToken() {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

/**
 * Store the JWT after login (email code or OAuth redirect).
 */
export function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Remove the stored JWT on logout.
 */
export function clearToken() {
  setToken(null);
}
