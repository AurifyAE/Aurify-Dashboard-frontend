'use client';

import React, { useEffect, useRef, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Loader from '@/components/loader/loader';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, hasHydrated, authState, isLoggingOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated || isLoading || authState === 'initializing' || isLoggingOut) {
      return;
    }

    if (!user || authState === 'unauthenticated') {
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        router.replace('/login');
      }
    }
  }, [user, isLoading, hasHydrated, authState, isLoggingOut, pathname, router]);

  // Initial cold boot loader (before hydration finishes)
  if (!hasHydrated || (isLoading && !user)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <Loader />
      </div>
    );
  }

  // If cold visiting unauthenticated, show loader while redirecting
  if (!user && authState === 'unauthenticated' && !isLoggingOut) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <Loader />
      </div>
    );
  }

  // Keep UI smoothly mounted during sign-out so spinner is visible and transition is seamless
  return <>{children}</>;
}
