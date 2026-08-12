import { BACKEND_URL } from '@/lib/env';
import { fetchWithAuth } from './client';
import type { TemplateConfig } from '@/lib/templateConfig';

export async function getTemplateConfig(templateId: string): Promise<TemplateConfig> {
  const res = await fetchWithAuth(`${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}`, {
    method: 'GET',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || 'Failed to load template config');
  }
  return json.data;
}

export async function saveTemplateConfig(
  templateId: string,
  config: TemplateConfig
): Promise<TemplateConfig> {
  const res = await fetchWithAuth(`${BACKEND_URL}/api/templates/${encodeURIComponent(templateId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || 'Failed to save template config');
  }
  return json.data;
}

export interface UploadedAsset {
  url: string;
}

export async function uploadTemplateAsset(file: File): Promise<UploadedAsset> {
  const form = new FormData();
  form.append('file', file);

  const res = await fetchWithAuth(`${BACKEND_URL}/api/uploads/image`, {
    method: 'POST',
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.message || 'Failed to upload asset');
  }
  return json;
}
