'use client';

import React, { useEffect, useState } from 'react';
import { marketplaceApi, type ScreenLayout } from '@/lib/api/marketplace';
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Monitor,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Rocket,
  Trash2,
} from 'lucide-react';
import Swal from 'sweetalert2';

interface MyScreensTabProps {
  onEditLayout: (layoutId: string) => void;
  onCreateNew: () => void;
}

// Removed MiniScreenPreview component

export default function MyScreensTab({ onEditLayout, onCreateNew }: MyScreensTabProps) {
  const [layouts, setLayouts] = useState<ScreenLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    marketplaceApi
      .layouts()
      .then(setLayouts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const copyUrl = async (url: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for non-HTTPS local network IPs
        const textArea = document.createElement('textarea');
        textArea.value = url;
        // Move outside of screen to make it invisible
        textArea.style.position = 'absolute';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDelete = async (layoutId: string, name: string) => {
    const result = await Swal.fire({
      title: 'Delete Screen?',
      text: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await marketplaceApi.deleteLayout(layoutId);
        setLayouts((prev) => prev.filter((l) => l.layoutId !== layoutId));
        Swal.fire({
          title: 'Deleted!',
          text: 'Your screen has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (err) {
        console.error('Failed to delete layout:', err);
        Swal.fire('Error', 'Failed to delete screen. Please try again.', 'error');
      }
    }
  };

  const liveUrl = (layout: any) => {
    const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    const baseUrl = isLocal ? 'http://localhost:3000' : 'https://screen.aurify.ae';
    return `${baseUrl}/${layout.merchantSlug || 'merchant'}/${layout.screenSlug}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Screens</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your published and draft TV screens.
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          New Screen
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Loading screens...</p>
        </div>
      ) : layouts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-20 text-center">
          <Monitor className="h-12 w-12 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No screens yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Create your first TV screen in the Screen Builder.
          </p>
          <button
            onClick={onCreateNew}
            className="mt-4 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Rocket className="h-4 w-4" />
            Open Screen Builder
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {layouts.map((layout) => {
            const url = liveUrl(layout);
            const isPublished = layout.status === 'published';
            return (
              <div
                key={layout.layoutId}
                className={`overflow-hidden flex flex-col rounded-2xl border transition-all hover:shadow-xl bg-white ${
                  isPublished
                    ? 'border-emerald-200 shadow-sm hover:border-emerald-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header / Cover Replacement */}
                <div
                  className={`p-5 flex flex-col gap-3 relative ${
                    isPublished
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-700'
                      : 'bg-gradient-to-br from-slate-700 to-slate-900'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md shadow-sm border border-white/20">
                      <Monitor className="h-5 w-5 text-white" />
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${
                        isPublished
                          ? 'bg-emerald-400/20 text-white border-emerald-300/30'
                          : 'bg-white/10 text-white border-white/20'
                      }`}
                    >
                      {layout.status}
                    </span>
                  </div>
                  <div className="mt-2">
                    <h3
                      className="font-bold text-lg text-white leading-tight truncate"
                      title={layout.name}
                    >
                      {layout.name}
                    </h3>
                    <p className="text-sm text-white/70 font-medium truncate">
                      /{layout.screenSlug}
                    </p>
                  </div>
                </div>

                {/* Info & Actions */}
                <div className="p-5 flex-1 flex flex-col">
                  {isPublished ? (
                    <div className="mb-5 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                      <span className="text-[10px] font-bold uppercase text-slate-400">URL</span>
                      <span
                        className="flex-1 truncate text-xs text-slate-600 font-mono"
                        title={url}
                      >
                        {url}
                      </span>
                      <button
                        onClick={() => copyUrl(url, layout.layoutId)}
                        className="text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0 cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedId === layout.layoutId ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="mb-5 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      This screen is currently a draft. Publish it to get your live URL.
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onEditLayout(layout.layoutId)}
                      className="btn-secondary cursor-pointer justify-center"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(layout.layoutId, layout.name)}
                      className="btn-secondary px-3 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 cursor-pointer"
                      title="Delete Screen"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>

                    {!isPublished ? (
                      <button
                        onClick={() => onEditLayout(layout.layoutId)}
                        className="btn-primary cursor-pointer justify-center col-span-2"
                      >
                        <Rocket className="h-3.5 w-3.5" />
                        Publish
                      </button>
                    ) : (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary col-span-2 justify-center bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Live
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
