import { BACKEND_URL } from '@/lib/env';
import { fetchWithAuth } from './client';

export type MerchantStatus = 'Pending' | 'Active' | 'Suspended';

export interface Merchant {
  merchantId: string;
  companyName: string;
  slug: string;
  logo?: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  city?: string;
  address?: string;
  website?: string;
  status: MerchantStatus;
  services: Record<string, boolean>;
  branding: Record<string, string>;
  visibility: Record<string, boolean>;
  maxScreens?: number;
  maxDevices?: number;
  serviceEndDate?: string;
}

export interface MarketplaceTheme {
  _id: string;
  name: string;
  category: string;
  widgets: string[];
  colors: Record<string, string>;
  fonts: string[];
}

export interface MerchantTheme {
  _id: string;
  merchantId: string;
  themeId: string;
  name: string;
  category: string;
  customizations: Record<string, unknown>;
}

export interface ScreenLayout {
  _id?: string;
  layoutId: string;
  merchantId?: string;
  name: string;
  screenSlug: string;
  themeId?: string;
  widgets: string[];
  styles: Record<string, unknown>;
  status: 'draft' | 'published' | 'archived';
  body?: Record<string, unknown>;
  header?: Record<string, unknown>;
  footer?: Record<string, unknown>;
  assignedDevices?: string[];
}

export interface MerchantNews {
  _id: string;
  title: string;
  content: string;
  type: string;
  priority: number;
  active: boolean;
  placement: string;
}

export interface MerchantCommodity {
  _id: string;
  name: string;
  metal: string;
  purity: string;
  weight: number;
  unit: string;
  buyPremium: number;
  sellPremium: number;
  buyCharge: number;
  sellCharge: number;
  active: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithAuth(`${BACKEND_URL}/api/marketplace${path}`, {
    cache: 'no-store',
    ...init,
  });

  const contentType = res.headers.get('content-type') || '';
  const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    if (res.status === 404 && !contentType.includes('application/json')) {
      throw new Error(
        'Marketplace API is unavailable. Restart the backend server (npm run dev in /server).'
      );
    }
    throw new Error(json.message || `Request failed (${res.status})`);
  }

  return json.data as T;
}

export const marketplaceApi = {
  myMerchant: () => request<Merchant | null>('/merchant/me'),
  registerMerchant: (body: unknown) =>
    request<Merchant>('/merchant/register', { method: 'POST', body: JSON.stringify(body) }),
  getProfile: () => request<{ merchant: Merchant; profile: Record<string, unknown> }>('/profile'),
  updateProfile: (body: unknown) =>
    request<{ merchant: Merchant; profile: Record<string, unknown> }>('/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  themes: () => request<MarketplaceTheme[]>('/themes'),
  installedThemes: () => request<MerchantTheme[]>('/themes/installed'),
  installTheme: (themeId: string) =>
    request<MerchantTheme>(`/themes/${themeId}/install`, { method: 'POST' }),
  layouts: () => request<ScreenLayout[]>('/layouts'),
  deleteLayout: (layoutId: string) => request<void>(`/layouts/${layoutId}`, { method: 'DELETE' }),
  saveLayout: (body: unknown) =>
    request<ScreenLayout>('/layouts', { method: 'PUT', body: JSON.stringify(body) }),
  publishLayout: (layoutId: string, body: unknown) =>
    request<{ liveUrl: string; screen: Record<string, unknown> }>(`/layouts/${layoutId}/publish`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  commodities: () => request<MerchantCommodity[]>('/merchant-commodities'),
  saveCommodity: (body: unknown, id?: string) =>
    request<MerchantCommodity>(id ? `/merchant-commodities/${id}` : '/merchant-commodities', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(body),
    }),
  deleteCommodity: (id: string) =>
    request<{ success: boolean; message: string }>(`/merchant-commodities/${id}`, {
      method: 'DELETE',
    }),
  news: () => request<MerchantNews[]>('/news'),
  saveNews: (body: unknown, id?: string) =>
    request<MerchantNews>(id ? `/news/${id}` : '/news', {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(body),
    }),
  deleteNews: (id: string) =>
    request<{ success: boolean; message: string }>(`/news/${id}`, {
      method: 'DELETE',
    }),
  allLiveScreens: () => request<any[]>('/screens/all'),
  checkScreenSlug: (slug: string, excludeLayoutId?: string) =>
    request<{ available: boolean; message?: string; suggestions?: string[] }>(
      `/screens/check-slug?slug=${encodeURIComponent(slug)}${excludeLayoutId ? `&excludeLayoutId=${encodeURIComponent(excludeLayoutId)}` : ''}`
    ),
  checkMerchantSlug: (slug: string) =>
    request<{ available: boolean; message?: string }>(
      `/merchant/check-slug?slug=${encodeURIComponent(slug)}`
    ),
};

export async function fetchLiveScreen(merchantSlug: string, screenSlug = 'main') {
  const res = await fetch(`${BACKEND_URL}/api/marketplace/live/${merchantSlug}/${screenSlug}`, {
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(json.message || 'Live screen unavailable') as any;
    error.status = res.status;
    throw error;
  }
  return json.data;
}
