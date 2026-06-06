"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  marketplaceApi,
  type MarketplaceTheme,
  type Merchant,
} from "@/lib/api/marketplace";
import {
  Building2,
  Check,
  MonitorPlay,
  Palette,
  Rocket,
  Store,
  Wand2,
} from "lucide-react";

const defaultBranding = {
  primaryColor: "#d4a017",
  secondaryColor: "#111827",
  accentColor: "#38bdf8",
  fontFamily: "Inter",
};

const defaultVisibility = {
  showCompanyLogo: true,
  showCompanyName: true,
  showSpotRates: true,
  showCommodities: true,
  showNews: true,
  showClock: true,
  showLondonFix: false,
};

export default function MarketplacePage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [themes, setThemes] = useState<MarketplaceTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    companyLogo: "",
    businessType: "Jewellery",
    country: "United Arab Emirates",
    city: "Dubai",
    address: "",
    website: "",
    email: "",
    phone: "",
    whatsapp: "",
    services: { tvDisplay: true, mobileApp: false, website: false },
    branding: defaultBranding,
    visibility: defaultVisibility,
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
            branding: { ...defaultBranding, ...(m.branding || {}) },
            visibility: { ...defaultVisibility, ...(m.visibility || {}) },
            services: {
              tvDisplay: true,
              mobileApp: false,
              website: false,
              ...(m.services || {}),
            },
          }));
        }
      })
      .catch((err) => setMessage(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeStep = useMemo(() => {
    if (!merchant) return "Registration";
    if (merchant.status === "Pending") return "Pending Approval";
    if (merchant.status === "Active") return "Dashboard Access";
    return "Suspended";
  }, [merchant]);

  const register = async () => {
    setSaving(true);
    setMessage("");
    try {
      const saved = await marketplaceApi.registerMerchant(form);
      setMerchant(saved);
      setMessage(
        "Registration submitted. Merchant is waiting for admin approval.",
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  const setNested = (
    section: "services" | "visibility",
    key: string,
    value: boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  return (
    <DashboardShell className="space-y-6">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                  <Store className="h-4 w-4" />
                  TV Screen Builder & Marketplace
                </div>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                  Merchant showroom screen SaaS
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Register the merchant, configure branding, install themes,
                  build layouts and publish dynamic screen URLs.
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="text-xs uppercase text-slate-500">
                  Current status
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  {activeStep}
                </div>
              </div>
            </section>

            <section className="grid gap-3 md:grid-cols-4">
              {[
                "Registration",
                "Pending Approval",
                "Admin Review",
                "Merchant Dashboard Access",
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <Check className="h-4 w-4 text-emerald-600" />
                  <div className="mt-3 text-sm font-semibold text-slate-900">
                    {step}
                  </div>
                </div>
              ))}
            </section>

            {message && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {message}
              </div>
            )}

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-lg border border-slate-200 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Merchant registration
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Company name"
                    value={form.companyName}
                    onChange={(e) =>
                      setForm({ ...form, companyName: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Logo URL"
                    value={form.companyLogo}
                    onChange={(e) =>
                      setForm({ ...form, companyLogo: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Business type"
                    value={form.businessType}
                    onChange={(e) =>
                      setForm({ ...form, businessType: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Phone"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                  <Input
                    placeholder="WhatsApp"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Country"
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                  />
                  <Input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                  <Input
                    className="md:col-span-2"
                    placeholder="Address"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                  />
                  <Input
                    className="md:col-span-2"
                    placeholder="Website"
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                  />
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">
                      Required services
                    </h3>
                    {Object.entries(form.services).map(([key, value]) => (
                      <label
                        key={key}
                        className="mb-2 flex items-center gap-2 text-sm text-slate-700"
                      >
                        <Checkbox
                          checked={value}
                          onCheckedChange={(v) =>
                            setNested("services", key, Boolean(v))
                          }
                        />
                        {key}
                      </label>
                    ))}
                  </div>
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-800">
                      Visibility settings
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(form.visibility).map(([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm text-slate-700"
                        >
                          <Checkbox
                            checked={value}
                            onCheckedChange={(v) =>
                              setNested("visibility", key, Boolean(v))
                            }
                          />
                          {key.replace("show", "")}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  {Object.entries(form.branding).map(([key, value]) => (
                    <Input
                      key={key}
                      type={key.includes("Color") ? "color" : "text"}
                      value={value}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          branding: { ...prev.branding, [key]: e.target.value },
                        }))
                      }
                      aria-label={key}
                    />
                  ))}
                </div>
                <Button
                  className="mt-5 bg-sky-600 hover:bg-sky-700"
                  onClick={register}
                  disabled={saving || loading}
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  {merchant ? "Refresh registration" : "Submit registration"}
                </Button>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border border-slate-200 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-slate-700" />
                    <h2 className="text-lg font-semibold text-slate-900">
                      Theme marketplace
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {themes.slice(0, 5).map((theme) => (
                      <div
                        key={theme._id}
                        className="rounded-lg border border-slate-200 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-slate-900">
                              {theme.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {theme.category}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              marketplaceApi.installTheme(theme._id)
                            }
                          >
                            Install
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/dashboard/theme-marketplace"
                    className="mt-4 inline-flex text-sm font-medium text-sky-700"
                  >
                    Open all themes
                  </Link>
                </div>
                <div className="grid gap-3">
                  {[
                    {
                      href: "/dashboard/screen-builder",
                      icon: MonitorPlay,
                      label: "Build and publish screens",
                    },
                    {
                      href: "/dashboard/merchant-commodities",
                      icon: Wand2,
                      label: "Manage merchant commodities",
                    },
                    {
                      href: "/dashboard/news-management",
                      icon: Store,
                      label: "Manage ticker news",
                    },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      <item.icon className="h-5 w-5 text-sky-700" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
    </DashboardShell>
  );
}
