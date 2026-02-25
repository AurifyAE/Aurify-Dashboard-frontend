"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Monitor, Wifi } from "lucide-react";
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

  // Live prices from socket, fallback to "—"
  const goldPrice = goldData?.displayBid ?? "—";
  const silverPrice = silverData?.displayBid ?? "—";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* My Screen and Network Status Cards */}
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="border rounded-xl shadow-lg border-slate-200 bg-white"
        >
          <CardContent className="p-6">
            <div className="flex flex-col  space-y-3">
              {/* Icon */}
              <div
                className={cn(
                  "p-2.5 rounded-lg w-fit",
                  index === 0 && "bg-blue-50 text-blue-600",
                  index === 1 && "bg-blue-50 text-blue-600",
                )}
              >
                {stat.icon}
              </div>

              {/* Label */}
              <p className="text-[25px]  text-slate-600 font-medium">
                {stat.label}
              </p>

              {/* Value */}
              <div>
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
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Gold and Silver Price Card — LIVE from socket */}
      <Card className="border-0 shadow-none bg-transparent lg:col-span-2">
        <div className="flex flex-col  gap-4 ">
          {/* Gold */}
          <div className="flex items-center overflow-hidden justify-between shadow-lg bg-white rounded-xl border border-slate-200   px-6 py-3 gap-3 flex-1">
            <div className="flex items-center gap-1.5 relative">
              <div className="w-sm -left-32 rounded-[150px]  bg-[#C9A44C1A] h-32 absolute"></div>
              <div className="w-auto h-[60px] relative z-1 flex items-center">
                <Image
                  src="/images/gold-bar.png"
                  alt="Gold"
                  width={300}
                  className="object-contain h-full w-full"
                  height={300}
                  quality={100}
                />
              </div>
              <p className="text-[24px] relative z-1 font-semibold text-[#C9A44C]">
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
          <div className="flex items-center overflow-hidden justify-between shadow-lg bg-white rounded-xl border border-slate-200   px-6 py-3 gap-3 flex-1">
            <div className="flex items-center gap-2">
              {isConnected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              <p className="text-[24px] font-bold text-slate-900">
                {silverPrice}
              </p>
            </div>
            <div className="flex items-center gap-1.5 relative">
              <div className="w-sm -right-32 rounded-[150px]  bg-[#BBBDBE1A] h-32 absolute"></div>
              <p className="text-[24px] relative z-1 font-semibold text-[#8C8E8F]">
                SILVER
              </p>
              <div className="w-auto h-[60px] relative z-1 flex items-center">
                <Image
                  src="/images/silver-bar.png"
                  alt="Silver"
                  width={300}
                  className="object-contain h-full w-full"
                  height={300}
                  quality={100}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardData;
