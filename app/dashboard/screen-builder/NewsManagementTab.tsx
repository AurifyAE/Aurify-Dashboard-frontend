'use client';

import React, { useEffect, useState } from 'react';
import { marketplaceApi, type MerchantNews } from '@/lib/api/marketplace';
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { Select, MenuItem } from '@mui/material';
import toast from 'react-hot-toast';

const TYPES = [
  { key: 'Market News', color: 'bg-blue-100 text-blue-700' },
  { key: 'Promotions', color: 'bg-purple-100 text-purple-700' },
  { key: 'Offers', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'Announcements', color: 'bg-blue-100 text-blue-700' },
  { key: 'Events', color: 'bg-pink-100 text-pink-700' },
];

const PLACEMENTS = [
  { key: 'Bottom Ticker', label: 'Bottom Ticker' },
  { key: 'Top Ticker', label: 'Top Ticker' },
  { key: 'Popup', label: 'Popup' },
  { key: 'Slider', label: 'Slider' },
];

const typeColor = (type: string) =>
  TYPES.find((t) => t.key === type)?.color || 'bg-slate-100 text-slate-700';

const defaultForm = {
  title: '',
  content: '',
  type: 'Announcements',
  priority: 1,
  active: true,
  placement: 'Bottom Ticker',
  startDate: '',
  endDate: '',
};

export default function NewsManagementTab({
  isEmbedded = false,
  onUpdate,
}: {
  isEmbedded?: boolean;
  onUpdate?: () => void;
}) {
  const [items, setItems] = useState<MerchantNews[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () =>
    marketplaceApi
      .news()
      .then(setItems)
      .catch((err) => {
        toast.dismiss();
        toast.error(err.message);
      });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.title.trim() && !form.content.trim()) {
      toast.dismiss();
      toast.error('Either title or content is required.');
      return;
    }
    setSaving(true);
    try {
      await marketplaceApi.saveNews(form, editingId || undefined);
      setForm(defaultForm);
      setEditingId(null);
      await load();
      if (onUpdate) onUpdate();
      toast.dismiss();
      toast.success(
        editingId ? 'News item updated successfully.' : 'News item added successfully.'
      );
      setShowForm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await marketplaceApi.deleteNews(id);
      await load();
      if (onUpdate) onUpdate();
      toast.dismiss();
      toast.success('News item deleted successfully.');
    } catch (err) {
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all';
  const labelClass = 'block mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className={isEmbedded ? 'space-y-4' : 'space-y-6'}>
      {/* Header */}
      {!isEmbedded && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Ticker & Announcements
            </div>
            <h1 className="text-2xl font-bold text-slate-900">News Management</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Control news tickers, promotions and announcements shown on your TV screens.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (showForm) {
                setForm(defaultForm);
                setEditingId(null);
                setShowForm(false);
              } else {
                setShowForm(true);
              }
            }}
            className="btn-primary"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add News'}
          </button>
        </div>
      )}

      {isEmbedded && (
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setForm(defaultForm);
              setEditingId(null);
              setShowForm(false);
            } else {
              setShowForm(true);
            }
          }}
          className="btn-secondary w-full"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Add News Item'}
        </button>
      )}

      <div className={`grid gap-6 ${isEmbedded ? 'grid-cols-1' : 'xl:grid-cols-[420px_1fr]'}`}>
        {/* Form Panel */}
        {showForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
              {editingId ? (
                <Pencil className="h-4 w-4 text-blue-500" />
              ) : (
                <Plus className="h-4 w-4 text-blue-500" />
              )}
              {editingId ? 'Edit News Item' : 'Create News Item'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  placeholder="e.g. Gold prices rally today"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>Content</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Full announcement text..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>

              <button type="button" onClick={save} disabled={saving} className="btn-primary w-full">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? 'Saving...' : 'Save News Item'}
              </button>
            </div>
          </div>
        )}

        {/* News Queue */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-slate-900">
              <Bell className="h-4 w-4 text-blue-500" />
              Ticker Queue
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                {items.length}
              </span>
            </h2>
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-16 text-center">
              <Bell className="h-10 w-10 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-500">No news items yet</p>
              <p className="mt-1 text-sm text-slate-400">
                Add your first announcement using the button above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items
                .slice()
                .sort((a, b) => b.priority - a.priority)
                .map((item) => (
                  <article
                    key={item._id}
                    className={`relative overflow-hidden rounded-2xl border bg-white p-4 transition-all hover:shadow-sm ${
                      item.active ? 'border-slate-200' : 'border-slate-100 opacity-60'
                    }`}
                  >
                    {/* Priority indicator removed since it's no longer used */}
                    <div className="pl-3">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setForm({
                                ...defaultForm,
                                title: item.title,
                                content: item.content || '',
                              });
                              setEditingId(item._id);
                              setShowForm(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-1 rounded text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit news item"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item._id)}
                            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete news item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      {item.content && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{item.content}</p>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
