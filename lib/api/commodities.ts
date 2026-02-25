import { BACKEND_URL } from "@/lib/env";
import { getToken } from "@/lib/auth";

export interface CommodityRow {
  id: string;
  metal: string;
  purity: string;
  unit: string;
  buyPremium: number;
  sellPremium: number;
  sellCharges: number;
  buyCharges: number;
}

function headers(): HeadersInit {
  const h: HeadersInit = {
    "Content-Type": "application/json",
  };
  const token = typeof window !== "undefined" ? getToken() : null;
  if (token) {
    (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

export async function fetchCommodities(): Promise<CommodityRow[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/commodities`, {
      method: "GET",
      headers: headers(),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to fetch commodities");
    return json.data ?? [];
  } catch (e) {
    if (e instanceof TypeError || (e instanceof Error && e.message.includes("fetch"))) {
      throw new Error(
        "Cannot connect to server. Ensure the backend is running (cd backend && npm run dev)."
      );
    }
    throw e;
  }
}

export async function createCommodity(body: {
  metal: string;
  purity: string;
  unit: string;
  buyPremium: number;
  sellPremium: number;
  sellCharges: number;
  buyCharges: number;
}): Promise<CommodityRow> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/commodities`, {
      method: "POST",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Surface a clear message for duplicate commodity attempts
      if (res.status === 409) {
        throw new Error(
          json.message ||
            "This commodity already exists with the same metal, purity and unit."
        );
      }
      throw new Error(json.message || "Failed to create commodity");
    }
    return json.data;
  } catch (e) {
    if (e instanceof TypeError || (e instanceof Error && e.message.includes("fetch"))) {
      throw new Error(
        "Cannot connect to server. Ensure the backend is running (cd backend && npm run dev)."
      );
    }
    throw e;
  }
}

export async function updateCommodity(
  id: string,
  body: Partial<Pick<CommodityRow, "buyPremium" | "sellPremium" | "sellCharges" | "buyCharges">>
): Promise<CommodityRow> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/commodities/${id}`, {
      method: "PATCH",
      headers: headers(),
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to update commodity");
    return json.data;
  } catch (e) {
    if (e instanceof TypeError || (e instanceof Error && e.message.includes("fetch"))) {
      throw new Error(
        "Cannot connect to server. Ensure the backend is running (cd backend && npm run dev)."
      );
    }
    throw e;
  }
}

export async function deleteCommodity(id: string): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/commodities/${id}`, {
      method: "DELETE",
      headers: headers(),
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to delete commodity");
  } catch (e) {
    if (e instanceof TypeError || (e instanceof Error && e.message.includes("fetch"))) {
      throw new Error(
        "Cannot connect to server. Ensure the backend is running (cd backend && npm run dev)."
      );
    }
    throw e;
  }
}
