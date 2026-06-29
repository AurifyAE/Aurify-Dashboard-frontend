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
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { Select, MenuItem } from '@mui/material';

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

export default function NewsManagementTab({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const [items, setItems] = useState<MerchantNews[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showForm, setShowForm] = useState(false);

  const load = () =>
    marketplaceApi
      .news()
      .then(setItems)
      .catch((err) => {
        setMessage(err.message);
        setMessageType('error');
      });

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.title.trim()) {
      setMessage('Title is required.');
      setMessageType('error');
      return;
    }
    setSaving(true);
    try {
      await marketplaceApi.saveNews(form);
      setForm(defaultForm);
      await load();
      setMessage('News item added successfully.');
      setMessageType('success');
      setShowForm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
      setMessageType('error');
    } finally {
      setSaving(false);
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
          <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-primary">
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add News'}
          </button>
        </div>
      )}

      {isEmbedded && (
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-secondary w-full"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel Adding News' : 'Add News Item'}
        </button>
      )}

      {/* Message */}
      {message && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${
            messageType === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {messageType === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {message}
          <button onClick={() => setMessage('')} className="ml-auto flex-shrink-0">
            <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className={`grid gap-6 ${isEmbedded ? 'grid-cols-1' : 'xl:grid-cols-[420px_1fr]'}`}>
        {/* Form Panel */}
        {showForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 font-bold text-slate-900">
              <Plus className="h-4 w-4 text-blue-500" />
              Create News Item
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Type</label>
                  <Select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as string })}
                    displayEmpty
                    fullWidth
                    size="small"
                    sx={{
                      borderRadius: '0.75rem',
                      height: '42px',
                      fontSize: '0.875rem',
                      backgroundColor: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        borderWidth: '1px',
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select type
                    </MenuItem>
                    {TYPES.map((t) => (
                      <MenuItem key={t.key} value={t.key}>
                        {t.key}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className={labelClass}>Placement</label>
                  <Select
                    value={form.placement}
                    onChange={(e) => setForm({ ...form, placement: e.target.value as string })}
                    displayEmpty
                    fullWidth
                    size="small"
                    sx={{
                      borderRadius: '0.75rem',
                      height: '42px',
                      fontSize: '0.875rem',
                      backgroundColor: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#3b82f6',
                        borderWidth: '1px',
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      Select placement
                    </MenuItem>
                    {PLACEMENTS.map((p) => (
                      <MenuItem key={p.key} value={p.key}>
                        {p.label}
                      </MenuItem>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Priority (1 = highest)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className={inputClass}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    <Calendar className="inline h-3 w-3 mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Calendar className="inline h-3 w-3 mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    className={inputClass}
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              {/* Active Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Active</p>
                  <p className="text-xs text-slate-400">Show this item on TV screens</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.active}
                  onClick={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
                  className={`relative h-6 w-11 rounded-full transition-all ${form.active ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${form.active ? 'left-6' : 'left-1'}`}
                  />
                </button>
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
                    {/* Priority indicator */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                      style={{
                        background:
                          item.priority >= 3
                            ? '#3051bb'
                            : item.priority === 2
                              ? '#60a5fa'
                              : '#94a3b8',
                      }}
                    />
                    <div className="pl-3">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${typeColor(item.type)}`}
                          >
                            {item.type}
                          </span>
                          <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-0.5 text-[10px] font-medium text-slate-500">
                            {item.placement}
                          </span>
                          {!item.active && (
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] font-bold text-slate-400">
                            P{item.priority}
                          </span>
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
