import { BACKEND_URL } from '@/lib/env';
import { getToken, setToken } from '@/lib/storage';
import { apiRefreshToken } from '@/services/auth/auth';
import { LogoutManager } from '@/services/auth/logoutManager';

interface FetchWithAuthOptions extends RequestInit {
  _retry?: boolean;
}

// A single shared promise for the active refresh request.
// If it's non-null, a refresh is in progress.
let refreshPromise: Promise<boolean> | null = null;

/**
 * Common headers for authenticated requests.
 */
function getAuthHeaders(customHeaders?: HeadersInit): HeadersInit {
  const h: HeadersInit = { 'Content-Type': 'application/json', ...customHeaders };
  const token = typeof window !== 'undefined' ? getToken() : null;
  if (token) {
    (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

/**
 * Core authenticated fetch wrapper.
 * Intercepts 401s, handles automatic token refresh locking/queueing,
 * and retries the original request exactly once.
 */
export async function fetchWithAuth(
  url: string,
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const isRefreshEndpoint = url.includes('/api/auth/refresh');

  // Build the initial request headers
  let requestHeaders = getAuthHeaders(options.headers);

  // 1. Attempt the request
  let res = await fetch(url, {
    ...options,
    headers: requestHeaders,
    credentials: 'include',
  });

  // 2. If it's not a 401, or we've already retried, or it's the refresh endpoint itself: just return the response.
  if (res.status !== 401 || options._retry || isRefreshEndpoint) {
    return res;
  }

  // 3. Handle 401: Acquire refresh lock or wait for the existing one.
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const newToken = await apiRefreshToken();
        if (newToken) {
          setToken(newToken);
          return true;
        }
        return false;
      } catch (error) {
        return false;
      } finally {
        // Clear the lock when done so future 401s can attempt a refresh again if needed
        refreshPromise = null;
      }
    })();
  }

  // 4. Wait for the refresh to complete
  const refreshSuccess = await refreshPromise;

  if (refreshSuccess) {
    // 5. Retry the original request exactly once
    options._retry = true;
    
    // Re-build headers to pick up the newly saved token
    requestHeaders = getAuthHeaders(options.headers);

    res = await fetch(url, {
      ...options,
      headers: requestHeaders,
      credentials: 'include',
    });
    
    // If it STILL returns 401 after a successful refresh, the session is genuinely invalid.
    if (res.status === 401) {
      LogoutManager.executeLogout({ redirectUrl: '/login?alert=session' });
    }
    
    return res;
  } else {
    // Refresh failed. The 7-day session is invalid/expired/revoked.
    LogoutManager.executeLogout({ redirectUrl: '/login?alert=session' });
    // Return the original 401 response so the caller can throw/handle it
    return res;
  }
}
