/**
 * storage.ts — Aurify-scoped storage and cookie helpers.
 *
 * Dedicated strictly to application-owned keys, avoiding blind `localStorage.clear()`
 * so third-party or browser-level preferences are preserved while zero authenticated data survives.
 */

export const TOKEN_KEY = 'aurify_token';
export const LOGOUT_SYNC_KEY = 'aurify_logout_event';

// Aurify-owned localStorage keys to purge on sign-out
const AUTH_STORAGE_KEYS = [
  TOKEN_KEY,
  'userName',
  'token',
  'aurify-builder-draft',
  'aurify_header_dismissed_notifs',
];

/**
 * Decode basic JWT payload on client side without extra dependencies
 */
export const decodeToken = (
  token: string
): { email?: string; role?: string; id?: string; companyName?: string } | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Stores active token, synchronizes active user email into localStorage,
 * and sets the Next.js middleware cookie (7-day expiry).
 */
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    const decoded = decodeToken(token);
    if (decoded?.email) {
      localStorage.setItem('userName', decoded.email);
    }
    // Set cookie for Next.js middleware (7-day expiry)
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
  }
};

/**
 * Retrieves the currently active auth token from localStorage
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * Clears the auth token and its associated cookies
 */
export const removeToken = (): void => {
  clearAuthStorage();
};

/**
 * Exhaustively purges all Aurify-owned storage keys and expires client-accessible cookies.
 */
export const clearAuthStorage = (): void => {
  if (typeof window === 'undefined') return;

  // 1. Clear Aurify-specific localStorage keys
  for (const key of AUTH_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storage] Failed to remove localStorage key "${key}":`, err);
    }
  }

  // 2. Clear Aurify-specific sessionStorage if any
  try {
    for (const key of AUTH_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
    }
  } catch {}

  // 3. Expire client-side cookie variations across all path/domain combinations
  const cookiePermutations = [
    `${TOKEN_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
    `${TOKEN_KEY}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `${TOKEN_KEY}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ];

  for (const cookieStr of cookiePermutations) {
    document.cookie = cookieStr;
  }

  // 4. Request server-side cookie deletion from Next.js route
  try {
    fetch('/api/auth/clear-cookie', { method: 'POST', credentials: 'include' }).catch(() => {});
  } catch {}
};
