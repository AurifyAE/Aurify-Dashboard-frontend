import { BACKEND_URL } from '@/lib/env';
import { fetchWithAuth } from './client';
export interface AdminMerchant {
  _id: string;
  merchantId: string;
  companyName: string;
  username?: string;
  email: string;
  status: string;
  maxScreens: number;
  maxDevices: number;
  serviceEndDate: string;
  createdAt: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  services: {
    tvDisplay: boolean;
    mobileApp: boolean;
    website: boolean;
  };
  additionalFeatures: string[];
  allowedCommodities: string[];
}

export const adminApi = {
  getMerchants: async () => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users`);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const json = await res.json();
    return json.data as AdminMerchant[];
  },
  updateMerchant: async (id: string, data: Partial<AdminMerchant>) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    const json = await res.json();
    return json.data as AdminMerchant;
  },
  deleteMerchant: async (id: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return await res.json();
  },
  resetPassword: async (id: string, newPassword: string) => {
    const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return await res.json();
  },
};
