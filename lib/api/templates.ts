import { BACKEND_URL } from "@/lib/env";
import { getToken } from "@/lib/auth";
import type { TemplateConfig } from "@/lib/templateConfig";

function authHeaders(extra?: HeadersInit): HeadersInit {
  const h: HeadersInit = {
    ...(extra || {}),
  };
  const token = typeof window !== "undefined" ? getToken() : null;
  if (token) {
    (h as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

export async function getTemplateConfig(
  templateId: string,
): Promise<TemplateConfig> {
  const res = await fetch(
    `${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}`,
    {
      method: "GET",
      headers: authHeaders(),
      credentials: "include",
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || "Failed to load template config");
  }
  return json.data;
}

export async function saveTemplateConfig(
  templateId: string,
  config: TemplateConfig,
): Promise<TemplateConfig> {
  const res = await fetch(
    `${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}`,
    {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      credentials: "include",
      body: JSON.stringify({ config }),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || "Failed to save template config");
  }
  return json.data;
}

export interface UploadedAsset {
  url: string;
}

export async function uploadTemplateAsset(
  file: File,
): Promise<UploadedAsset> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BACKEND_URL}/api/uploads/image`, {
    method: "POST",
    headers: authHeaders(),
    credentials: "include",
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || "Failed to upload asset");
  }
  return json;
}

