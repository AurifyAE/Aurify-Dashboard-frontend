'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AuthUser,
  AuthResponse,
  getToken,
  setToken,
  removeToken,
  decodeToken,
  apiLogin,
  apiRegister,
} from '@/lib/auth';
import { fetchWithAuth } from '@/lib/api/client';
import { LogoutManager, AuthState, LogoutResult } from '@/services/auth/logoutManager';
import { CleanupRegistry } from '@/lib/CleanupRegistry';

// ─── Context Types ────────────────────────────────────────────────────────────
export interface AuthContextValue {
  user: AuthUser | null;
  authState: AuthState;
  isLoading: boolean;
  hasHydrated: boolean;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: {
    companyName: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
    logo?: string;
    services?: {
      tvDisplay: boolean;
      website: boolean;
      mobileApp: boolean;
    };
  }) => Promise<AuthResponse>;
  logout: (options?: { redirectUrl?: string }) => Promise<LogoutResult>;
  reset: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authState, setAuthState] = useState<AuthState>(LogoutManager.state);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Subscribe to LogoutManager auth state machine transitions
  useEffect(() => {
    const unregister = LogoutManager.onStateChange((newState) => {
      setAuthState(newState);
      if (newState === 'unauthenticated') {
        setUser(null);
      }
    });
    return unregister;
  }, []);

  // Explicit reset handler registered with LogoutManager
  const reset = useCallback(() => {
    setUser(null);
    setIsLoading(false);
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    const unregister = LogoutManager.onReset(reset);
    return unregister;
  }, [reset]);

  // Keep the latest pathname in a ref
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const hasHydratedRef = useRef(hasHydrated);
  useEffect(() => {
    hasHydratedRef.current = hasHydrated;
  }, [hasHydrated]);

  // Stable redirect helper — reason: 'deleted' = account removed/suspended, 'session' = generic expiry
  const forceRegisterRedirect = useCallback(
    (reason: 'deleted' | 'session' = 'session') => {
      removeToken();
      setUser(null);
      LogoutManager.setState('unauthenticated');
      if (
        !pathnameRef.current.startsWith('/login') &&
        !pathnameRef.current.startsWith('/register')
      ) {
        router.push(`/login?alert=${reason}`);
      }
    },
    [router]
  );

  const forceRegisterRedirectRef = useRef(forceRegisterRedirect);
  useEffect(() => {
    forceRegisterRedirectRef.current = forceRegisterRedirect;
  }, [forceRegisterRedirect]);

  // Stable auth-check function
  const checkAuthStatus = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      setHasHydrated(true);
      LogoutManager.setState('unauthenticated');
      return;
    }

    // Fast initial hydration via local decode (no network delay)
    if (!hasHydratedRef.current) {
      const decoded = decodeToken(token);
      if (decoded && decoded.id && decoded.email) {
        setUser({
          id: decoded.id,
          email: decoded.email,
          role: (decoded.role as any) || 'user',
          companyName: decoded.companyName || '',
        });
        LogoutManager.setState('authenticated');
      }
      setHasHydrated(true);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const res = await fetchWithAuth(
        `${(await import('@/lib/env')).BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001'}/api/auth/me`,
        {
          method: 'GET',
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      // On 401/403, fetchWithAuth already attempted a refresh.
      // If it's STILL 401, the session is genuinely expired.
      if (res.status === 401 || res.status === 403) {
        forceRegisterRedirectRef.current('session');
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        // Server error or network issue — keep user logged in, don't redirect
        console.warn('Auth check returned non-OK status:', res.status);
        setIsLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({ success: false }));
      if (data.success && data.user) {
        const newUser = data.user;
        setUser((prevUser) => {
          if (!prevUser) return newUser;
          if (
            prevUser.id === newUser.id &&
            prevUser.email === newUser.email &&
            prevUser.role === newUser.role &&
            prevUser.companyName === newUser.companyName &&
            prevUser.phone === newUser.phone &&
            prevUser.status === newUser.status
          ) {
            return prevUser;
          }
          return newUser;
        });
        LogoutManager.setState('authenticated');
      } else if (data.success === false && data.message?.toLowerCase().includes('deleted')) {
        // Explicitly deleted/suspended account — force logout with 'deleted' reason
        forceRegisterRedirectRef.current('deleted');
      }
      // If data.success is false for any other reason, stay logged in
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err?.name === 'AbortError') {
        console.warn('Auth check timed out — server unreachable, staying logged in');
      } else {
        // Network error / server down — keep user logged in, don't redirect
        console.warn('Auth check network error (staying logged in):', err);
      }
    }
    setIsLoading(false);
  }, []);

  const isOnAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

  useEffect(() => {
    if (isOnAuthPage) {
      setIsLoading(false);
      setHasHydrated(true);
      return;
    }

    // Initial check
    checkAuthStatus();

    // Poll every 10 seconds to catch admin deletions/suspensions
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 10000);

    // Register interval teardown with CleanupRegistry so it stops immediately on logout
    const unregisterCleanup = CleanupRegistry.registerCleanup(() => {
      clearInterval(interval);
    });

    return () => {
      clearInterval(interval);
      unregisterCleanup();
    };
  }, [isOnAuthPage, checkAuthStatus]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      const response = await apiLogin(email, password);
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        LogoutManager.setState('authenticated');
        if (response.user.role === 'admin' || response.user.role === 'super_admin') {
          router.push('/dashboard/admin/clients');
        } else {
          router.push('/dashboard');
        }
      }
      return response;
    },
    [router]
  );

  const register = useCallback(
    async (data: {
      companyName: string;
      email: string;
      phone?: string;
      password: string;
      confirmPassword: string;
      logo?: string;
      services?: {
        tvDisplay: boolean;
        website: boolean;
        mobileApp: boolean;
      };
    }): Promise<AuthResponse> => {
      const response = await apiRegister(data);
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        LogoutManager.setState('authenticated');
        router.push('/dashboard');
      }
      return response;
    },
    [router]
  );

  const logout = useCallback((options?: { redirectUrl?: string }) => {
    return LogoutManager.executeLogout(options);
  }, []);

  const isLoggingOut = authState === 'logging_out';

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authState,
      isLoading,
      hasHydrated,
      isAuthenticated: !!user && authState === 'authenticated',
      isLoggingOut,
      login,
      register,
      logout,
      reset,
    }),
    [user, authState, isLoading, hasHydrated, isLoggingOut, login, register, logout, reset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
