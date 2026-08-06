/**
 * auth.ts — Authentication API client methods
 */

import { BACKEND_URL } from '@/lib/env';

export type UserRole = 'super_admin' | 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  companyName: string;
  phone?: string;
  status?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  message?: string;
  errors?: Record<string, string>;
}

const BASE_URL = BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

export const apiLogin = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const apiRegister = async (data: {
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
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return res.json();
};

export const apiGetMe = async (token: string): Promise<AuthResponse> => {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    credentials: 'include',
  });
  return res.json();
};

/**
 * apiLogout with 2.5-second timeout protection.
 * Even if the backend or network hangs, it rejects cleanly so the client proceeds.
 */
export const apiLogout = async (timeoutMs: number = 2500): Promise<{ success: boolean; error?: string }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const json = await res.json().catch(() => ({}));
    return { success: res.ok && json.success !== false };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const isTimeout = err?.name === 'AbortError';
    return {
      success: false,
      error: isTimeout ? 'timeout' : 'network_error',
    };
  }
};
