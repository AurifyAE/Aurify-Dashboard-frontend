'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { marketplaceApi, type Merchant } from '@/lib/api/marketplace';
import {
  Building2,
  Camera,
  Check,
  Clock,
  Facebook,
  Globe,
  Image as ImageIcon,
  Instagram,
  Linkedin,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Trash2,
  Youtube,
} from 'lucide-react';

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.81 1.54V6.78a4.87 4.87 0 01-1.04-.09z" />
  </svg>
);

const SOCIAL_CONFIGS = [
  {
    key: 'facebook',
    icon: Facebook,
    label: 'Facebook',
    placeholder: 'https://facebook.com/yourpage',
    color: 'text-blue-600',
  },
  {
    key: 'instagram',
    icon: Instagram,
    label: 'Instagram',
    placeholder: 'https://instagram.com/yourhandle',
    color: 'text-pink-500',
  },
  {
    key: 'linkedin',
    icon: Linkedin,
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/company/yourco',
    color: 'text-blue-700',
  },
  {
    key: 'youtube',
    icon: Youtube,
    label: 'YouTube',
    placeholder: 'https://youtube.com/@yourchannel',
    color: 'text-red-500',
  },
];

const HOURS_CONFIG = [
  { key: 'mondayFriday', label: 'Monday – Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

type BranchItem = { name: string; city?: string; address?: string; phone?: string };

export default function MerchantProfilePage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'company' | 'social' | 'hours' | 'branches'>(
    'company'
  );
  const [initialSlug, setInitialSlug] = useState('');
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugMessage, setSlugMessage] = useState('');

  useEffect(() => {
    marketplaceApi
      .getProfile()
      .then((data) => {
        setMerchant(data.merchant);
        setInitialSlug(data.merchant.slug || '');
        setProfile(data.profile || {});
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const slug = merchant?.slug?.trim();
    if (!slug) {
      setSlugAvailable(null);
      setSlugMessage('');
      return;
    }

    if (slug === initialSlug) {
      setSlugAvailable(true);
      setSlugMessage('');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugAvailable(false);
      setSlugMessage('Only lowercase letters, numbers, and hyphens allowed.');
      return;
    }

    const RESERVED_SLUGS = [
      'admin',
      'api',
      'assets',
      'static',
      'login',
      'logout',
      'register',
      'screen',
      'builder',
      'dashboard',
      'preview',
      'settings',
      'support',
      'help',
      'favicon.ico',
      'robots.txt',
    ];
    if (RESERVED_SLUGS.includes(slug)) {
      setSlugAvailable(false);
      setSlugMessage('This slug is a reserved system keyword.');
      return;
    }

    setSlugChecking(true);
    const handler = setTimeout(async () => {
      try {
        const res = await marketplaceApi.checkMerchantSlug(slug);
        setSlugAvailable(res.available);
        if (!res.available) {
          setSlugMessage(res.message || 'Already in use.');
        } else {
          setSlugMessage('');
        }
      } catch (err) {
        console.error('Merchant slug check failed:', err);
        setSlugAvailable(null);
      } finally {
        setSlugChecking(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [merchant?.slug, initialSlug]);

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = {
        companyName: merchant?.companyName,
        slug: merchant?.slug,
        logo: merchant?.logo,
        phone: merchant?.phone,
        whatsapp: merchant?.whatsapp,
        website: profile.website,
        address: profile.address,
        banner: profile.banner,
        about: profile.about,
        branches: profile.branches || [],
        socialLinks: profile.socialLinks || {},
        businessHours: profile.businessHours || {},
      };
      const data = await marketplaceApi.updateProfile(payload);
      setMerchant(data.merchant);
      setProfile(data.profile || {});
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setSocial = (key: string, value: string) =>
    setProfile((prev) => ({
      ...prev,
      socialLinks: { ...(prev.socialLinks || {}), [key]: value },
    }));

  const setHours = (key: string, value: string) =>
    setProfile((prev) => ({
      ...prev,
      businessHours: { ...(prev.businessHours || {}), [key]: value },
    }));

  const addBranch = () =>
    setProfile((prev) => ({
      ...prev,
      branches: [...(prev.branches || []), { name: '', city: '', address: '', phone: '' }],
    }));

  const updateBranch = (index: number, field: string, value: string) =>
    setProfile((prev) => {
      const branches = [...(prev.branches || [])];
      branches[index] = { ...branches[index], [field]: value };
      return { ...prev, branches };
    });

  const removeBranch = (index: number) =>
    setProfile((prev) => ({
      ...prev,
      branches: (prev.branches || []).filter((_: any, i: number) => i !== index),
    }));

  const inputClass =
    'w-full rounded-2xl border border-slate-200/60 bg-slate-50/50 backdrop-blur-sm px-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:border-blue-500/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300';

  const labelClass = 'block mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 ml-1';

  const TABS = [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'social', label: 'Social Media', icon: Globe },
    { key: 'hours', label: 'Business Hours', icon: Clock },
    { key: 'branches', label: 'Branches', icon: MapPin },
  ] as const;

  return (
    <DashboardShell>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your brand identity, contact info, social links, and branch locations.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile Hero Banner */}
      <div className="mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 h-40">
        <img
          src="/images/profile-bg.svg"
          alt="Banner"
          className="absolute top-0 right-20 h-full w-fit object-contain opacity-40"
        />
        {profile.banner && (
          <img
            src={profile.banner}
            alt="Banner"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-6 flex items-end gap-4">
          {/* Logo Avatar */}
          <div className="relative h-16 w-16 rounded-2xl border-2 border-white/20 bg-slate-700 flex items-center justify-center shadow-xl overflow-hidden">
            {merchant?.logo ? (
              <img src={merchant.logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {merchant?.companyName?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div className="pb-1">
            <p className="text-lg font-bold text-white">
              {merchant?.companyName || 'Your Company'}
            </p>
            <p className="text-xs text-white/60">{merchant?.email}</p>
          </div>
        </div>
        <div className="absolute right-4 top-4">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              merchant?.status === 'Active'
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${merchant?.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
            />
            {merchant?.status || 'Pending'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 relative flex overflow-x-auto rounded-2xl border border-white/60 bg-white/40 backdrop-blur-xl p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm transition-all duration-300 whitespace-nowrap cursor-pointer ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-500 font-semibold hover:text-slate-700 hover:bg-slate-50/50'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-white rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] -z-10 border border-slate-100"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              <tab.icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: Company */}
      {activeTab === 'company' && (
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-2xl p-8 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
          <h2 className="mb-8 flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 text-blue-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]">
              <Building2 className="h-5 w-5" />
            </div>
            Company Details
          </h2>
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Company Name</label>
              <input
                className={inputClass}
                value={merchant?.companyName || ''}
                onChange={(e) =>
                  setMerchant((m) => (m ? { ...m, companyName: e.target.value } : m))
                }
              />
            </div>
            <div>
              <label className={`${labelClass} flex items-center justify-between`}>
                <span>Merchant URL Namespace</span>
                {slugChecking ? (
                  <span className="text-[10px] text-blue-500 animate-pulse">
                    Checking availability…
                  </span>
                ) : slugAvailable === true ? (
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold">
                    ✓ Available
                  </span>
                ) : slugAvailable === false ? (
                  <span className="text-[10px] text-red-500 flex items-center gap-1 font-bold">
                    ✕ {slugMessage}
                  </span>
                ) : null}
              </label>
              <input
                className={`${inputClass} ${
                  slugAvailable === true
                    ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20'
                    : slugAvailable === false
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : ''
                }`}
                placeholder="e.g. al-fardan"
                value={merchant?.slug || ''}
                onChange={(e) => {
                  const rawVal = e.target.value;
                  const cleanVal = rawVal
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                  setMerchant((m) => (m ? { ...m, slug: cleanVal } : m));
                }}
              />
              {merchant?.slug && (
                <p className="mt-1.5 text-[11px] text-slate-500 font-mono">
                  Screens URL prefix:{' '}
                  <span className="text-slate-800 font-semibold">
                    screen.aurify.ae/{merchant.slug}
                  </span>
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass}>About Us</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Tell customers about your business..."
                value={profile.about || ''}
                onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Globe className="inline h-3 w-3 mr-1" />
                Website
              </label>
              <input
                className={inputClass}
                placeholder="https://..."
                value={profile.website || ''}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>
                <MapPin className="inline h-3 w-3 mr-1" />
                Address
              </label>
              <input
                className={inputClass}
                placeholder="Street, Building, Area"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Phone className="inline h-3 w-3 mr-1" />
                Phone
              </label>
              <input
                className={inputClass}
                placeholder="+971 ..."
                value={merchant?.phone || ''}
                onChange={(e) => setMerchant((m) => (m ? { ...m, phone: e.target.value } : m))}
              />
            </div>
            <div>
              <label className={labelClass}>
                <MessageCircle className="inline h-3 w-3 mr-1" />
                WhatsApp
              </label>
              <input
                className={inputClass}
                placeholder="+971 ..."
                value={merchant?.whatsapp || ''}
                onChange={(e) => setMerchant((m) => (m ? { ...m, whatsapp: e.target.value } : m))}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB: Social Media */}
      {activeTab === 'social' && (
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-2xl p-8 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
          <h2 className="mb-8 flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]">
              <Globe className="h-5 w-5" />
            </div>
            Social Media Links
          </h2>
          <div className="space-y-4">
            {SOCIAL_CONFIGS.map((soc) => (
              <div key={soc.key} className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 ${soc.color}`}
                >
                  <soc.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">
                    {soc.label}
                  </label>
                  <input
                    className={inputClass}
                    placeholder={soc.placeholder}
                    value={profile.socialLinks?.[soc.key] || ''}
                    onChange={(e) => setSocial(soc.key, e.target.value)}
                  />
                </div>
              </div>
            ))}
            {/* TikTok */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-700">
                <TikTokIcon />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs font-semibold text-slate-600">TikTok</label>
                <input
                  className={inputClass}
                  placeholder="https://tiktok.com/@yourhandle"
                  value={profile.socialLinks?.tiktok || ''}
                  onChange={(e) => setSocial('tiktok', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Business Hours */}
      {activeTab === 'hours' && (
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-2xl p-8 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
          <h2 className="mb-8 flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]">
              <Clock className="h-5 w-5" />
            </div>
            Business Hours
          </h2>
          <div className="space-y-4">
            {HOURS_CONFIG.map((h) => (
              <div
                key={h.key}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-slate-50/50 backdrop-blur-sm px-5 py-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:bg-white"
              >
                <span className="text-sm font-bold text-slate-700 w-32 tracking-wide">{h.label}</span>
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  placeholder="e.g. 09:00 – 18:00 or Closed"
                  value={profile.businessHours?.[h.key] || ''}
                  onChange={(e) => setHours(h.key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Branches */}
      {activeTab === 'branches' && (
        <div className="rounded-3xl border border-white/80 bg-white/70 backdrop-blur-2xl p-8 shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="flex items-center gap-3 font-black text-slate-900 text-xl tracking-tight">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)]">
                <MapPin className="h-5 w-5" />
              </div>
              Branch Locations
            </h2>
            <button type="button" onClick={addBranch} className="btn-secondary">
              <Plus className="h-4 w-4" />
              Add Branch
            </button>
          </div>
          {!profile.branches || profile.branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <MapPin className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No branches added yet</p>
              <p className="text-xs mt-1">Click "Add Branch" to add your first location</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(profile.branches || []).map((branch: BranchItem, i: number) => (
                <div
                  key={i}
                  className="relative rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-lg bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      Branch {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBranch(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Branch Name *</label>
                      <input
                        className={inputClass}
                        placeholder="e.g. Main Branch"
                        value={branch.name || ''}
                        onChange={(e) => updateBranch(i, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>City</label>
                      <input
                        className={inputClass}
                        placeholder="Dubai"
                        value={branch.city || ''}
                        onChange={(e) => updateBranch(i, 'city', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Address</label>
                      <input
                        className={inputClass}
                        placeholder="Street, Building"
                        value={branch.address || ''}
                        onChange={(e) => updateBranch(i, 'address', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        className={inputClass}
                        placeholder="+971 ..."
                        value={branch.phone || ''}
                        onChange={(e) => updateBranch(i, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save Button at Bottom */}
      <div className="mt-8 flex justify-end sticky bottom-6 z-20">
        <button
          onClick={save}
          disabled={saving || slugAvailable === false || slugChecking}
          className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-4 font-bold text-white shadow-[0_8px_25px_rgba(79,70,229,0.3)] transition-all duration-300 hover:shadow-[0_12px_35px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : saved ? (
            <Check className="h-5 w-5" />
          ) : (
            <Save className="h-5 w-5 group-hover:scale-110 transition-transform" />
          )}
          <span className="tracking-wide text-sm">{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}</span>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </button>
      </div>
    </DashboardShell>
  );
}
