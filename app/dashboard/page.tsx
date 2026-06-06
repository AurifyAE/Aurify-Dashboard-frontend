"use client";

import React, { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardData from "@/components/dashboard/DashboardData";
import Loader from "@/components/loader/loader";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <Loader />}
      <DashboardShell className="space-y-6 ">
        <DashboardData />
      </DashboardShell>
    </>
  );
}
