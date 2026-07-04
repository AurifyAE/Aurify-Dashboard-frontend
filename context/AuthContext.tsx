'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

  const forceRegisterRedirect = useCallback(() => {
    removeToken();
    setUser(null);
    // Don't redirect if already on an auth page — avoids redirect loops
    if (!pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/login?alert=deleted');
    }
  }, [router, pathname]);

  // Hydrate and verify user on mount, route change, and interval
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        setHasHydrated(true);
        return;
      }

      // Fast initial hydration
      if (!hasHydrated) {
        const decoded = decodeToken(token);
        setUser(decoded);
        setHasHydrated(true);
      }

      try {
        const res = await apiGetMe(token);
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          // If token is invalid or user is deleted/suspended
          forceRegisterRedirect();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
      setIsLoading(false);
    };

    // Skip auth checks entirely on public auth pages
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
      setIsLoading(false);
      setHasHydrated(true);
      return;
    }

    checkAuthStatus();

    // Poll every 10 seconds to catch admin deletions instantly
    const interval = setInterval(checkAuthStatus, 10000);
    return () => clearInterval(interval);
  }, [pathname, forceRegisterRedirect, hasHydrated]);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        hasHydrated,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
