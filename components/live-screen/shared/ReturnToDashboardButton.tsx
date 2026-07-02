'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ReturnToDashboardButton() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [targetUrl, setTargetUrl] = useState('/dashboard');

  useEffect(() => {
    if (!isLoading) {
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        setTargetUrl('/dashboard/admin/clients');
      } else {
        setTargetUrl('/dashboard');
      }
    }
  }, [user, isLoading]);

  return (
    <button
      onClick={() => router.push(targetUrl)}
      disabled={isLoading}
      className="inline-block px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-xs text-white shadow-sm hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50"
    >
      Return to Dashboard
    </button>
  );
}
