import { AUTH_TOKEN_KEY } from "../Constants";

/**
 * Get the stored JWT. Used by HttpClient to send Authorization: Bearer.
 */
export function getToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || null;
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
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
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
