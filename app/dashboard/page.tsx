"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardData from "@/components/dashboard/DashboardData";
import Loader from "@/components/loader/loader";
import { marketplaceApi, type Merchant } from "@/lib/api/marketplace";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Rocket,
  XCircle,
} from "lucide-react";

function MerchantStatusBanner({ merchant }: { merchant: Merchant | null }) {
  if (!merchant) {
    return (
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
          <AlertCircle className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-blue-800">Complete Your Merchant Registration</p>
          <p className="mt-0.5 text-sm text-blue-600">
            Register your business to unlock TV screen management, themes, and live publishing.
          </p>
        </div>
        <Link
          href="/dashboard/marketplace"
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-all"
        >
          <Rocket className="h-3.5 w-3.5" />
          Register Now
        </Link>
      </div>
    );
  }

  if (merchant.status === "Pending") {
    return (
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-5 w-5 text-amber-600 animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-amber-800">Pending Admin Approval</p>
          <p className="mt-0.5 text-sm text-amber-600">
            {merchant.companyName} · Your account is under review. Usually takes 1–2 business days.
          </p>
        </div>
        <span className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          Pending
        </span>
      </div>
    );
  }

  if (merchant.status === "Active") {
    return (
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-800">Account Active — Ready to Publish</p>
          <p className="mt-0.5 text-sm text-emerald-600">
            {merchant.companyName} · Your merchant account is fully approved.
          </p>
        </div>
        <Link
          href="/dashboard/screen-builder"
          className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-all"
        >
          <Rocket className="h-3.5 w-3.5" />
          Go Live
        </Link>
      </div>
    );
  }

  if (merchant.status === "Suspended") {
    return (
      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-red-800">Account Suspended</p>
          <p className="mt-0.5 text-sm text-red-600">Please contact support to resolve your account status.</p>
        </div>
      </div>
    );
  }

  return null;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [merchant, setMerchant] = useState<Merchant | null | undefined>(undefined);

  useEffect(() => {
    // Load merchant status quietly
    marketplaceApi.myMerchant()
      .then((data) => {
        setMerchant(data);
      })
      .catch(() => {
        setMerchant(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      {loading && <Loader />}
      <DashboardShell className="space-y-6">
        {/* Merchant Status Banner */}
        {merchant !== undefined && (
          <MerchantStatusBanner merchant={merchant} />
        )}
        <DashboardData />
      </DashboardShell>
    </>
  );
}
