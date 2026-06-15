"use client";

import React, { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  marketplaceApi,
  type MarketplaceTheme,
  type Merchant,
} from "@/lib/api/marketplace";
import {
  Building2,
  Check,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Palette,
  Phone,
  Smartphone,
  Sparkles,
  Store,
  Rocket,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

const BUSINESS_TYPES = [
  "Jewellery Shop",
  "Bullion Dealer",
  "Gold Trader",
  "Silver Trader",
  "Precious Metal Dealer",
  "Pawn Shop",
  "Luxury Retailer",
  "Other",
];

const FONT_FAMILIES = [
  "Inter",
  "Roboto",
  "Poppins",
  "DM Sans",
  "Playfair Display",
  "Cinzel",
  "Cairo",
  "Montserrat",
];

const defaultBranding = {
  primaryColor: "#d4a017",
  secondaryColor: "#111827",
  accentColor: "#38bdf8",
  fontFamily: "Inter",
};

const defaultServices = { tvDisplay: true, mobileApp: false, website: false };

const SERVICE_CARDS = [
  {
    key: "tvDisplay",
    icon: Monitor,
    title: "TV Display Solution",
    description: "Live gold & silver rates on showroom TVs",
  },
  {
    key: "mobileApp",
    icon: Smartphone,
    title: "Mobile Application",
    description: "Custom branded app for your customers",
  },
  {
    key: "website",
    icon: Globe,
    title: "Website Development",
    description: "Professional website for your business",
  },
];

const STEPS = [
  { id: 1, label: "Company Info" },
  { id: 2, label: "Services" },
  { id: 3, label: "Branding" },
];

type FormState = {
  companyName: string;
  companyLogo: string;
  businessType: string;
  country: string;
  city: string;
  address: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  services: Record<string, boolean>;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
  };
};

function StatusBanner({ merchant }: { merchant: Merchant }) {
  if (merchant.status === "Pending") {
    return (
      <div className="mb-6 flex items-start gap-4 rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-blue-800">Pending Admin Approval</p>
          <p className="mt-0.5 text-sm text-blue-700">
            Your merchant registration is under review. You'll receive access
            once approved. This usually takes 1–2 business days.
          </p>
        </div>
      </div>
    );
  }
  if (merchant.status === "Active") {
    return (
      <div className="mb-6 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-emerald-800">Account Active</p>
          <p className="mt-0.5 text-sm text-emerald-700">
            Your merchant account is fully approved. You can now publish screens
            and go live.
          </p>
        </div>
      </div>
    );
  }
  if (merchant.status === "Suspended") {
    return (
      <div className="mb-6 flex items-start gap-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="font-semibold text-red-800">Account Suspended</p>
          <p className="mt-0.5 text-sm text-red-700">
            Your account has been suspended. Please contact support.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function ApprovalTimeline({ status }: { status: string }) {
  const steps = [
    { label: "Registration", done: true },
    { label: "Pending Review", done: status === "Active" || status === "Suspended" },
    { label: "Admin Approved", done: status === "Active" },
    { label: "Dashboard Access", done: status === "Active" },
  ];
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <p className="mb-4 text-sm font-semibold text-slate-700">
        Registration Progress
      </p>
      <div className="flex items-center gap-0">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                  step.done
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white text-slate-400"
                }`}
              >
                {step.done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-center text-[10px] font-medium leading-tight ${
                  step.done ? "text-emerald-600" : "text-slate-400"
                }`}
                style={{ maxWidth: 72 }}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 -translate-y-3 transition-all ${
                  steps[i + 1].done ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [form, setForm] = useState<FormState>({
    companyName: "",
    companyLogo: "",
    businessType: "Jewellery Shop",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "",
    website: "",
    email: "",
    phone: "",
    whatsapp: "",
    services: defaultServices,
    branding: defaultBranding,
  });

  useEffect(() => {
    Promise.all([marketplaceApi.myMerchant(), marketplaceApi.themes()])
      .then(([m, t]) => {
        setMerchant(m);
        setThemes(t);
        if (m) {
          setForm((prev) => ({
            ...prev,
            companyName: m.companyName || "",
            email: m.email || "",
            phone: m.phone || "",
            whatsapp: m.whatsapp || "",
            website: m.website || "",
            address: m.address || "",
            country: m.country || prev.country,
            city: m.city || prev.city,
            businessType: (m as any).businessType || prev.businessType,
            branding: { ...defaultBranding, ...(m.branding || {}) },
            services: { ...defaultServices, ...(m.services || {}) },
          }));
        }
      })
      .catch((err) => {
        setMessage(err.message);
        setMessageType("error");
      })
      .finally(() => setLoading(false));
  }, []);

  const register = async () => {
    setSaving(true);
    setMessage("");
    try {
      const saved = await marketplaceApi.registerMerchant(form);
      setMerchant(saved);
      setMessage("Registration submitted! Awaiting admin approval.");
      setMessageType("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Registration failed");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all";

  const labelClass = "block mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <DashboardShell className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600">
            <Store className="h-3.5 w-3.5" />
            TV Screen Builder & Marketplace
          </div>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-900">
            Merchant Registration
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Register your business to unlock TV screen management, themes, and
            live screen publishing.
          </p>
        </div>
        {merchant && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide ${
              merchant.status === "Active"
                ? "bg-emerald-100 text-emerald-700"
                : merchant.status === "Suspended"
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${
              merchant.status === "Active"
                ? "bg-emerald-500"
                : merchant.status === "Suspended"
                  ? "bg-red-500"
                  : "bg-blue-500 animate-pulse"
            }`} />
            {merchant.status}
          </span>
        )}
      </div>

      {/* Status Banner */}
      {merchant && <StatusBanner merchant={merchant} />}

      {/* Timeline */}
      {merchant && <ApprovalTimeline status={merchant.status} />}

      {/* Message */}
      {message && (
        <div
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            messageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {messageType === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          )}
          {message}
        </div>
      )}

      {/* Main Registration Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Step Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-all ${
                step === s.id
                  ? "border-b-2 border-blue-600 bg-white text-blue-700"
                  : step > s.id
                    ? "text-emerald-600"
                    : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  step === s.id
                    ? "bg-blue-600 text-white"
                    : step > s.id
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                }`}
              >
                {step > s.id ? <Check className="h-3 w-3" /> : s.id}
              </span>
              <span className="hidden sm:block">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 lg:p-8">
          {/* STEP 1 — Company Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Company Information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tell us about your business. This info appears on your TV
                  screens.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Company Name *</label>
                  <input
                    className={inputClass}
                    placeholder="e.g. Al Fardan Jewellery"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Business Type</label>
                  <select
                    className={inputClass}
                    value={form.businessType}
                    onChange={(e) =>
                      setForm({ ...form, businessType: e.target.value })
                    }
                  >
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Logo URL</label>
                  <input
                    className={inputClass}
                    placeholder="https://..."
                    value={form.companyLogo}
                    onChange={(e) =>
                      setForm({ ...form, companyLogo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    className={inputClass}
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    className={inputClass}
                    placeholder="Dubai"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Address</label>
                  <input
                    className={inputClass}
                    placeholder="Street, Building, Area"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Mail className="inline h-3 w-3 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="info@company.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <Globe className="inline h-3 w-3 mr-1" />
                    Website
                  </label>
                  <input
                    className={inputClass}
                    placeholder="https://company.com"
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
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
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
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
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary"
                >
                  Next: Choose Services
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Services */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Select Services
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the services your business requires. You can update
                  these later.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {SERVICE_CARDS.map((svc) => {
                  const selected = form.services[svc.key];
                  return (
                    <button
                      key={svc.key}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          services: {
                            ...prev.services,
                            [svc.key]: !prev.services[svc.key],
                          },
                        }))
                      }
                      className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-all ${
                        selected
                          ? "border-blue-400 bg-blue-50/50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {selected && (
                        <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </span>
                      )}
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-sm ${
                          selected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <svc.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {svc.title}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {svc.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary"
                >
                  Next: Branding
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Branding */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Brand Identity
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Define your brand colors and typography. These will be applied
                  across your TV screens.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Color Pickers */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Color Palette
                  </h3>
                  {[
                    {
                      key: "primaryColor",
                      label: "Primary Color",
                      hint: "Main brand color, used for headings & accents",
                    },
                    {
                      key: "secondaryColor",
                      label: "Secondary Color",
                      hint: "Background or supporting color",
                    },
                    {
                      key: "accentColor",
                      label: "Accent Color",
                      hint: "Highlight color for prices & badges",
                    },
                  ].map((field) => (
                    <div key={field.key} className="flex items-center gap-4">
                      <div className="relative">
                        <input
                          type="color"
                          value={(form.branding as any)[field.key]}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              branding: {
                                ...prev.branding,
                                [field.key]: e.target.value,
                              },
                            }))
                          }
                          className="h-12 w-12 cursor-pointer rounded-xl border-2 border-slate-200 p-0.5"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">
                          {field.label}
                        </p>
                        <p className="text-xs text-slate-400">{field.hint}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-500">
                          {(form.branding as any)[field.key]}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Preview */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Live Preview
                  </h3>
                  <div
                    className="relative overflow-hidden rounded-2xl p-5 shadow-inner"
                    style={{
                      background: form.branding.secondaryColor,
                      fontFamily: form.branding.fontFamily,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p
                          className="text-lg font-bold"
                          style={{ color: form.branding.primaryColor }}
                        >
                          {form.companyName || "Your Company"}
                        </p>
                        <p className="text-xs opacity-60 text-white">
                          Jewellery & Bullion
                        </p>
                      </div>
                      <div
                        className="rounded-lg px-3 py-1 text-xs font-bold"
                        style={{
                          background: form.branding.primaryColor,
                          color: form.branding.secondaryColor,
                        }}
                      >
                        LIVE
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {["GOLD", "SILVER"].map((metal, i) => (
                        <div
                          key={metal}
                          className="rounded-lg p-3"
                          style={{
                            background: `${form.branding.primaryColor}22`,
                            borderLeft: `3px solid ${i === 0 ? form.branding.primaryColor : form.branding.accentColor}`,
                          }}
                        >
                          <p
                            className="text-[10px] font-bold"
                            style={{ color: i === 0 ? form.branding.primaryColor : form.branding.accentColor }}
                          >
                            {metal}
                          </p>
                          <p className="text-sm font-bold text-white">
                            {i === 0 ? "2,345.60" : "28.40"}
                          </p>
                          <p className="text-[9px] text-white/50">USD/oz</p>
                        </div>
                      ))}
                    </div>
                    <div
                      className="mt-3 rounded px-3 py-1.5 text-[10px] font-semibold"
                      style={{
                        background: form.branding.accentColor,
                        color: form.branding.secondaryColor,
                      }}
                    >
                      📢 Special offer: Gold coins available today
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className={labelClass}>Font Family</label>
                    <select
                      className={inputClass}
                      value={form.branding.fontFamily}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          branding: {
                            ...prev.branding,
                            fontFamily: e.target.value,
                          },
                        }))
                      }
                      style={{ fontFamily: form.branding.fontFamily }}
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f} style={{ fontFamily: f }}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={register}
                  disabled={saving || loading}
                  className="btn-primary px-8"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4" />
                      {merchant ? "Update Registration" : "Submit Registration"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theme Preview Section */}
      {themes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-900">Featured Themes</h2>
            </div>
            <a
              href="/dashboard/theme-marketplace"
              className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {themes.slice(0, 5).map((theme) => (
              <div
                key={theme._id}
                className="group relative overflow-hidden rounded-xl border border-slate-100 hover:border-slate-200 transition-all"
              >
                <div
                  className="flex aspect-video items-center justify-center text-xs font-bold"
                  style={{
                    background: theme.colors?.secondary || "#111827",
                    color: theme.colors?.primary || "#d4a017",
                  }}
                >
                  <div className="text-center">
                    <div className="text-lg">◆</div>
                    <div className="mt-1 text-[10px] opacity-80">
                      {theme.name}
                    </div>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {theme.name}
                  </p>
                  <p className="text-[10px] text-slate-400">{theme.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
