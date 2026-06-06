"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Monitor,
  Wifi,
  Activity,
  CreditCard,
  Bell,
  ShieldCheck,
  Plus,
  Tv,
  User,
  Headphones,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useSpotRate } from "@/context/SpotRateContext";

const DashboardData = () => {
  const { goldData, silverData, isConnected } = useSpotRate();

  const [networkStatus, setNetworkStatus] = useState<
    "Healthy" | "Moderate" | "Poor"
  >("Healthy");

  useEffect(() => {
    const updateNetworkStatus = () => {
      if (!navigator.onLine) {
        setNetworkStatus("Poor");
        return;
      }

      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection) {
        const { effectiveType, downlink } = connection;

        // Priority: actual speed (downlink Mbps)
        if (downlink >= 5) {
          setNetworkStatus("Healthy");
        } else if (downlink >= 1) {
          setNetworkStatus("Moderate");
        } else {
          setNetworkStatus("Poor");
        }

        // Fallback using effectiveType
        if (effectiveType === "4g") {
          setNetworkStatus("Healthy");
        } else if (effectiveType === "3g") {
          setNetworkStatus("Moderate");
        } else {
          setNetworkStatus("Poor");
        }

        connection.addEventListener("change", updateNetworkStatus);
      }
    };

    updateNetworkStatus();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);
  const quickActions = [
    {
      title: "Add Screen",
      icon: <Plus size={20} />,
    },
    {
      title: "Screen Builder",
      icon: <Tv size={20} />,
    },
    {
      title: "Profile",
      icon: <User size={20} />,
    },
    {
      title: "Support",
      icon: <Headphones size={20} />,
    },
  ];

  const systemStatus = [
    {
      label: "WebSocket",
      status: "Online",
    },
    {
      label: "Spot Feed",
      status: "Running",
    },
    {
      label: "TV Service",
      status: "Healthy",
    },
    {
      label: "API",
      status: "Connected",
    },
  ];
  const stats = [
    {
      label: "My Screen",
      value: "1",
      icon: <Monitor className="h-5 w-5" />,
    },
    {
      label: "Network Status",
      value: networkStatus,
      status: networkStatus,
      statusColor:
        networkStatus === "Healthy" ? "text-green-500" : "text-red-500",
      icon: <Wifi className="h-5 w-5" />,
    },
  ];
  const activeDevices = [
    {
      name: "Main Showroom TV",
      status: "Online",
      lastSeen: "Just now",
    },
    {
      name: "Reception Display",
      status: "Online",
      lastSeen: "2 min ago",
    },
    {
      name: "VIP Lounge Screen",
      status: "Offline",
      lastSeen: "1 hour ago",
    },
  ];

  const recentActivities = [
    {
      title: "Screen content updated",
      time: "10 mins ago",
    },
    {
      title: "New spot rate received",
      time: "25 mins ago",
    },
    {
      title: "Device connected",
      time: "1 hour ago",
    },
  ];

  const marketNews = [
    {
      title: "Gold trades higher amid global demand",
      source: "Reuters",
    },
    {
      title: "Silver gains as industrial demand rises",
      source: "Bloomberg",
    },
    {
      title: "Precious metals remain stable this week",
      source: "MarketWatch",
    },
  ];
  // Live prices from socket, fallback to "—"
  const goldPrice = goldData?.displayBid ?? "—";
  const silverPrice = silverData?.displayBid ?? "—";

  return (
    <>
      {/* Existing Top Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* My Screen and Network Status Cards */}
        {stats.map((stat, index) => (
          <Card
            key={index}
            className="border rounded-xl shadow-lg border-slate-200 bg-white"
          >
            <CardContent className="p-6">
              <div className="flex flex-col space-y-3">
                <div
                  className={cn(
                    "p-2.5 rounded-lg w-fit",
                    "bg-blue-50 text-blue-600",
                  )}
                >
                  {stat.icon}
                </div>

                <p className="text-[25px] text-slate-600 font-medium">
                  {stat.label}
                </p>

                {stat.status ? (
                  <h3
                    className={cn(
                      "text-[25px] font-semibold",
                      stat.statusColor,
                    )}
                  >
                    {stat.status}
                  </h3>
                ) : (
                  <h3 className="text-[25px] font-semibold text-slate-900">
                    {stat.value}
                  </h3>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Gold + Silver */}
        <Card className="border-0 shadow-none bg-transparent lg:col-span-2">
          <div className="flex flex-col gap-4">
            {/* Gold */}
            <div className="flex items-center overflow-hidden justify-between shadow-lg bg-white rounded-xl border border-slate-200 px-6 py-3 gap-3 flex-1">
              <div className="flex items-center gap-1.5 relative">
                <div className="w-sm -left-32 rounded-[150px] bg-[#C9A44C1A] h-32 absolute"></div>

                <div className="w-auto h-[60px] relative z-10 flex items-center">
                  <Image
                    src="/images/gold-bar.png"
                    alt="Gold"
                    width={300}
                    height={300}
                    quality={100}
                    className="object-contain h-full w-full"
                  />
                </div>

                <p className="text-[24px] relative z-10 font-semibold text-[#C9A44C]">
                  GOLD
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}

                <p className="text-[24px] font-bold text-slate-900">
                  {goldPrice}
                </p>
              </div>
            </div>

            {/* Silver */}
            <div className="flex items-center overflow-hidden justify-between shadow-lg bg-white rounded-xl border border-slate-200 px-6 py-3 gap-3 flex-1">
              <div className="flex items-center gap-2">
                {isConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}

                <p className="text-[24px] font-bold text-slate-900">
                  {silverPrice}
                </p>
              </div>

              <div className="flex items-center gap-1.5 relative">
                <div className="w-sm -right-32 rounded-[150px] bg-[#BBBDBE1A] h-32 absolute"></div>

                <p className="text-[24px] relative z-10 font-semibold text-[#8C8E8F]">
                  SILVER
                </p>

                <div className="w-auto h-[60px] relative z-10 flex items-center">
                  <Image
                    src="/images/silver-bar.png"
                    alt="Silver"
                    width={300}
                    height={300}
                    quality={100}
                    className="object-contain h-full w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* New Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Screen Health */}
        <Card className="border border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <Activity className="text-green-600" />
              <h3 className="font-semibold text-lg">Screen Health</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Online Screens</span>
                <span className="font-bold text-green-600">3</span>
              </div>

              <div className="flex justify-between">
                <span>Offline Screens</span>
                <span className="font-bold text-red-500">0</span>
              </div>

              <div className="flex justify-between">
                <span>Last Sync</span>
                <span className="font-medium">Just now</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="border border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <CreditCard className="text-[#C9A44C]" />
              <h3 className="font-semibold text-lg">Subscription</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Plan</span>
                <span className="font-semibold">Premium</span>
              </div>

              <div className="flex justify-between">
                <span>Screens Used</span>
                <span className="font-semibold">3 / 10</span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="w-[30%] h-full bg-[#C9A44C]" />
              </div>

              <div className="flex justify-between">
                <span>Expiry</span>
                <span className="font-semibold">31 Dec 2026</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-5">Quick Actions</h3>

            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-5 hover:border-[#C9A44C] hover:bg-[#C9A44C]/5 transition-all"
                >
                  {action.icon}
                  <span className="text-sm font-medium">{action.title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Market Status */}
        <Card className="border border-slate-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <TrendingUp className="text-green-500" />
              <h3 className="font-semibold text-lg">Live Market Status</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Gold Bid</span>
                <span className="font-bold">{goldPrice}</span>
              </div>

              <div className="flex justify-between">
                <span>Silver Bid</span>
                <span className="font-bold">{silverPrice}</span>
              </div>

              <div className="flex justify-between">
                <span>Feed Status</span>

                <span className="text-green-600 font-semibold">Live</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Summary */}
      <Card className="border border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-5">Recent Activity</h3>

          <div className="space-y-5">
            {recentActivities.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-3 h-3 mt-1 rounded-full bg-[#C9A44C]" />

                <div>
                  <p className="font-medium">{item.title}</p>

                  <p className="text-sm text-slate-500">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck className="text-green-500" />
            <h3 className="font-semibold text-lg">System Status</h3>
          </div>

          <div className="space-y-4">
            {systemStatus.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.label}</span>

                <span className="text-green-600 font-medium">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* News */}
      <div className="grid md:grid-cols-3 gap-4">
  {marketNews.map((news, index) => (
    <div
      key={index}
      className="rounded-xl border border-slate-200 p-5 hover:border-[#C9A44C] transition-all"
    >
      <Bell className="mb-3 text-[#C9A44C]" />

      <p className="font-semibold leading-relaxed">
        {news.title}
      </p>

      <p className="text-sm text-slate-500 mt-3">
        {news.source}
      </p>
    </div>
  ))}
</div>
    </>
  );
};

export default DashboardData;
