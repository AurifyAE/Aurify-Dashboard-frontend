import axiosInstance from "@/app/axios/axiosInstance";

export interface AdminMerchant {
  _id: string;
  merchantId: string;
  companyName: string;
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
    const response = await axiosInstance.get<{ data: AdminMerchant[] }>("/admin/users");
    return response.data.data;
  },
  updateMerchant: async (id: string, data: Partial<AdminMerchant>) => {
    const response = await axiosInstance.patch<{ data: AdminMerchant }>(`/admin/users/${id}`, data);
    return response.data.data;
  },
  deleteMerchant: async (id: string) => {
    const response = await axiosInstance.delete(`/admin/users/${id}`);
    return response.data;
  },
  resetPassword: async (id: string, newPassword: string) => {
    const response = await axiosInstance.post(`/admin/users/${id}/reset-password`, { newPassword });
    return response.data;
  },
};
