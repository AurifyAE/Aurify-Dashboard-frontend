"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { marketplaceApi, type Merchant } from "@/lib/api/marketplace";
import { Save } from "lucide-react";

export default function MerchantProfilePage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    marketplaceApi
      .getProfile()
      .then((data) => {
        setMerchant(data.merchant);
        setProfile(data.profile || {});
      })
      .catch((err) => setMessage(err.message));
  }, []);

  const save = async () => {
    setMessage("");
    try {
      const payload = {
        companyName: merchant?.companyName,
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
      setMessage("Profile saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    }
  };

  const setSocial = (key: string, value: string) =>
    setProfile((prev) => ({ ...prev, socialLinks: { ...(prev.socialLinks || {}), [key]: value } }));

  const setHours = (key: string, value: string) =>
    setProfile((prev) => ({ ...prev, businessHours: { ...(prev.businessHours || {}), [key]: value } }));

  return (
    <DashboardShell>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Company Profile</h1>
                <p className="text-sm text-slate-600">Manage logo, banner, contact information, branches, social links and business hours.</p>
              </div>
              <Button onClick={save} className="bg-sky-600 hover:bg-sky-700">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
            {message && <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{message}</div>}
            <div className="grid gap-6 xl:grid-cols-2">
              <section className="rounded-lg border border-slate-200 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Company</h2>
                <div className="grid gap-4">
                  <Input placeholder="Company name" value={merchant?.companyName || ""} onChange={(e) => setMerchant((m) => (m ? { ...m, companyName: e.target.value } : m))} />
                  <Input placeholder="Logo URL" value={merchant?.logo || ""} onChange={(e) => setMerchant((m) => (m ? { ...m, logo: e.target.value } : m))} />
                  <Input placeholder="Banner URL" value={profile.banner || ""} onChange={(e) => setProfile({ ...profile, banner: e.target.value })} />
                  <Textarea placeholder="About us" value={profile.about || ""} onChange={(e) => setProfile({ ...profile, about: e.target.value })} />
                  <Input placeholder="Website" value={profile.website || ""} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
                  <Input placeholder="Address" value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
                </div>
              </section>
              <section className="rounded-lg border border-slate-200 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Social Media</h2>
                <div className="grid gap-4">
                  {["facebook", "instagram", "linkedin", "youtube", "tiktok"].map((key) => (
                    <Input key={key} placeholder={key} value={profile.socialLinks?.[key] || ""} onChange={(e) => setSocial(key, e.target.value)} />
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-slate-200 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Business Hours</h2>
                <div className="grid gap-4">
                  {[
                    ["mondayFriday", "Monday-Friday"],
                    ["saturday", "Saturday"],
                    ["sunday", "Sunday"],
                  ].map(([key, label]) => (
                    <Input key={key} placeholder={label} value={profile.businessHours?.[key] || ""} onChange={(e) => setHours(key, e.target.value)} />
                  ))}
                </div>
              </section>
              <section className="rounded-lg border border-slate-200 p-5">
                <h2 className="mb-4 font-semibold text-slate-900">Branches</h2>
                <Textarea
                  rows={8}
                  placeholder="One branch per line: Name, City, Address, Phone"
                  value={(profile.branches || []).map((b: any) => [b.name, b.city, b.address, b.phone].filter(Boolean).join(", ")).join("\n")}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      branches: e.target.value
                        .split("\n")
                        .filter(Boolean)
                        .map((line) => {
                          const [name, city, address, phone] = line.split(",").map((v) => v.trim());
                          return { name, city, address, phone };
                        }),
                    })
                  }
                />
              </section>
            </div>
    </DashboardShell>
  );
}
