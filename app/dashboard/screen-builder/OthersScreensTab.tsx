"use client";

import React, { useEffect, useState } from "react";
import { marketplaceApi } from "@/lib/api/marketplace";
import { Loader2, Monitor, ExternalLink } from "lucide-react";

export default function OthersScreensTab() {
  const [screens, setScreens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    marketplaceApi
      .allLiveScreens()
      .then(setScreens)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Showroom TV Screens</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Explore live published TV screens from other gold and bullion dealers.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin mb-3" />
          <p className="text-sm">Loading showroom screens...</p>
        </div>
      ) : screens.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 py-20 text-center">
          <Monitor className="h-12 w-12 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No other screens live yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Once other dealers publish screens, they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {screens.map((screen) => (
            <div
              key={screen._id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md flex flex-col justify-between"
            >
              <div className="p-4 flex items-center gap-3 border-b border-slate-100">
                {screen.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={screen.logo}
                    alt={screen.companyName}
                    className="h-10 w-10 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {screen.companyName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{screen.companyName}</p>
                  <p className="text-xs text-slate-400 truncate">/{screen.screenSlug}</p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50/50 flex flex-col items-center justify-center aspect-video border-b border-slate-100">
                <Monitor className="h-10 w-10 text-slate-300 mb-2" />
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded">
                  Live Feed Display
                </span>
              </div>

              <div className="p-4">
                <a
                  href={`/${screen.slug}/${screen.screenSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Screen Live
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
