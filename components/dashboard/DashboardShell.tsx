'use client';

import React, { ReactNode } from 'react';
import Image from 'next/image';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function DashboardShell({
  children,
  className,
  contentClassName,
}: DashboardShellProps) {
  return (
    <div className="relative h-screen flex overflow-hidden bg-slate-100">
      <div className="background_image  pointer-events-none fixed inset-0 -z-0 " aria-hidden>
        <Image
          src="/images/background.svg"
          height={1200}
          width={1200}
          alt=""
          priority
          className="background_image__img"
        />
      </div>
      <Sidebar />
      <div className="flex-1 transition-all duration-300 p-5 overflow-hidden relative z-1">
        <div className="h-full bg-white rounded-[15px] overflow-hidden flex flex-col shadow-sm">
          <Header />
          <main className={cn('flex-1 overflow-y-auto p-6', className, contentClassName)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
