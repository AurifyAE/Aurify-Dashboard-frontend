'use client';

import React, { ReactNode, memo } from 'react';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * DashboardShell — wrapped in React.memo so page-level state changes
 * (e.g. merchant fetch, local UI state) do not cause the global
 * Header and Sidebar to re-render unnecessarily.
 *
 * React.memo is effective here because DashboardShell's props
 * (children, className, contentClassName) rarely change — children
 * is a new React element reference each render, but React.memo does a
 * shallow comparison of each prop; since children is always the same
 * logical subtree and className/contentClassName are string literals,
 * the shell itself skips re-renders while the children slot still
 * updates correctly.
 */
const DashboardShell = memo(function DashboardShell({
  children,
  className,
  contentClassName,
}: DashboardShellProps) {
  return (
    <div className="relative h-screen flex overflow-hidden bg-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-gradient-to-bl from-[#05010D]   via-[#220a38] to-[#08021a]" />{' '}
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
});

export default DashboardShell;
