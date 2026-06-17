"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

// The backend URL where our tracking socket.io is running
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:5000";

interface DeviceTrackerProps {
  merchantId: string;
  screenSlug: string;
}

export default function DeviceTracker({ merchantId, screenSlug }: DeviceTrackerProps) {
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    // Connect to OUR backend, not the SpotRate server
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join-screen", { merchantId, screenSlug });
    });

    socket.on("device-limit-reached", (data: { maxDevices: number }) => {
      setLimitReached(true);
      // We can also disconnect after being rejected
      socket.disconnect();
    });

    socket.on("disconnect", () => {
      // Re-connect will automatically re-trigger "connect" and "join-screen"
    });

    return () => {
      socket.disconnect();
    };
  }, [merchantId, screenSlug]);

  if (limitReached) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <div className="max-w-md space-y-5 rounded-3xl border border-red-800 bg-slate-800/80 p-8 backdrop-blur-md shadow-2xl">
          <div className="h-16 w-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto border border-red-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M9 14v1" />
              <path d="M15 14v1" />
              <path d="M9 9v1" />
              <path d="M15 9v1" />
              <path d="M3 12h18" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-red-400">Screen Limit Exceeded</h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your account has reached the maximum allowed concurrent live screens. Please upgrade your plan or close another active screen to view this one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
