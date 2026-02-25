"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  AuthUser,
  AuthResponse,
  getToken,
  setToken,
  removeToken,
  decodeToken,
  apiLogin,
  apiRegister,
} from "@/lib/auth";

// ─── Context Types ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: {
    companyName: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
  }) => Promise<AuthResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Hydrate user from stored token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = decodeToken(token);
      setUser(decoded);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResponse> => {
      const response = await apiLogin(email, password);
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        router.push("/dashboard");
      }
      return response;
    },
    [router],
  );

  const register = useCallback(
    async (data: {
      companyName: string;
      email: string;
      phone?: string;
      password: string;
      confirmPassword: string;
    }): Promise<AuthResponse> => {
      const response = await apiRegister(data);
      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        router.push("/dashboard");
      }
      return response;
    },
    [router],
  );

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
