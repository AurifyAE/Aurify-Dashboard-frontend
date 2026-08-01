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
  apiGetMe,
} from '@/lib/auth';

// ─── Context Types ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  hasHydrated: boolean;
  isAuthenticated: boolean;
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
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Keep the latest pathname in a ref so callbacks can read it without becoming deps
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Keep track of hydration in a ref to avoid re-creating the auth-check function
  const hasHydratedRef = useRef(hasHydrated);
  useEffect(() => {
    hasHydratedRef.current = hasHydrated;
  }, [hasHydrated]);

  // Stable redirect helper — reads pathname from ref, never recreated on route change
  const forceRegisterRedirect = useCallback(() => {
    removeToken();
    setUser(null);
    // Don't redirect if already on an auth page — avoids redirect loops
    if (
      !pathnameRef.current.startsWith('/login') &&
      !pathnameRef.current.startsWith('/register')
    ) {
      router.push('/login?alert=deleted');
    }
  }, [router]); // router is stable across navigations in Next.js

  // Keep the latest forceRegisterRedirect in a ref so the polling effect
  // doesn't need it as a dependency (and therefore doesn't restart the interval)
  const forceRegisterRedirectRef = useRef(forceRegisterRedirect);
  useEffect(() => {
    forceRegisterRedirectRef.current = forceRegisterRedirect;
  }, [forceRegisterRedirect]);

  // Stable auth-check function that reads from refs — not recreated on navigation
  const checkAuthStatus = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      setHasHydrated(true);
      return;
    }

    // Fast initial hydration via local decode (no network)
    if (!hasHydratedRef.current) {
      const decoded = decodeToken(token);
      setUser(decoded);
      setHasHydrated(true);
    }

    try {
      const res = await apiGetMe(token);
      if (res.success && res.user) {
        const newUser = res.user;
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
      } else {
        forceRegisterRedirectRef.current();
      }
    } catch (err) {
      console.error('Auth check failed:', err);
    }
    setIsLoading(false);
  }, []); // stable — reads everything from refs

  // ── Bootstrap: run once and start polling every 10s ──
  // Only restart the effect (and therefore the polling interval) when:
  // - pathname changes to/from an auth page (to skip or resume polling)
  // This avoids restarting the interval on every internal navigation.
  const isOnAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/register');

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

    return () => clearInterval(interval);
  }, [isOnAuthPage, checkAuthStatus]); // checkAuthStatus is stable; isOnAuthPage changes only on auth-page entry/exit

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      const response = await apiLogin(email, password);
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
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
        router.push('/dashboard');
      }
      return response;
    },
    [router]
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    router.push('/login');
  }, [router]);

  // ── Memoize Provider value so consumers don't re-render on unrelated parent renders ──
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      hasHydrated,
      isAuthenticated: !!user,
      login,
      register,
      logout,
    }),
    [user, isLoading, hasHydrated, login, register, logout]
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
