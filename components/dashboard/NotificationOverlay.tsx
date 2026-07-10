'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useNotifications, type ToastItem } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  X,
} from 'lucide-react';

export default function NotificationOverlay() {
  const { toastQueue, dismissToast } = useNotifications();

  if (toastQueue.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed z-[9999] pointer-events-none transition-all duration-300',
        // Desktop: top-right, Mobile: top-center
        'top-4 right-4 w-80 max-w-[90vw]',
        'mobile:left-1/2 mobile:right-auto mobile:-translate-x-1/2 mobile:w-[90%] mobile:max-w-sm'
      )}
    >
      <div className="relative w-full min-h-[140px]">
        {toastQueue.map((toast, idx) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            index={idx}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface ToastCardProps {
  toast: ToastItem;
  index: number;
  onDismiss: () => void;
}

function ToastCard({ toast, index, onDismiss }: ToastCardProps) {
  const { title, message, variant, actions, duration = 5000 } = toast;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  const triggerDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // match exit transition animation duration
  };

  // Timer loop with pause/resume support
  useEffect(() => {
    if (isDismissing) return;

    if (!isPaused) {
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        triggerDismiss();
      }, remainingTimeRef.current);

      // Animation interval for the shrinking progress bar
      const tick = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed);
        setProgress((currentRemaining / duration) * 100);
      }, 30);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        clearInterval(tick);
      };
    } else {
      // If paused, track remaining time
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    }
  }, [isPaused, isDismissing]);

  // Accessibility: Escape key handler to close the toast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && index === 0) {
        triggerDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Icon mapping
  const getIcon = () => {
    switch (variant) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'ERROR':
        return <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'LOADING':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  // Accent color mapping
  const getVariantStyles = () => {
    switch (variant) {
      case 'SUCCESS':
        return 'border-l-[4px] border-l-emerald-500 bg-emerald-50/20 text-emerald-950';
      case 'WARNING':
        return 'border-l-[4px] border-l-amber-500 bg-amber-50/20 text-amber-950';
      case 'ERROR':
        return 'border-l-[4px] border-l-red-500 bg-red-50/20 text-red-950';
      case 'LOADING':
        return 'border-l-[4px] border-l-blue-500 bg-blue-50/20 text-blue-950';
      default:
        return 'border-l-[4px] border-l-blue-500 bg-blue-50/20 text-blue-950';
    }
  };

  // Stack positioning calculation
  // Index 0: active/frontmost card (fully scaled and visible)
  // Index 1: 1st peeking background card (slightly scaled down and shifted down)
  // Index 2: 2nd peeking background card
  // Index >= 3: hidden off-stage
  const getStackStyles = () => {
    if (index >= 3) {
      return {
        opacity: 0,
        transform: 'translate3d(0, 30px, 0) scale(0.85)',
        zIndex: 10,
        pointerEvents: 'none' as const,
      };
    }

    const scale = 1 - index * 0.04; // 1.0, 0.96, 0.92
    const translateY = index * 12; // 0px, 12px, 24px
    const opacity = 1 - index * 0.25; // 1.0, 0.75, 0.50

    return {
      opacity,
      transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
      zIndex: 100 - index,
      pointerEvents: index === 0 ? ('auto' as const) : ('none' as const),
    };
  };

  return (
    <div
      role={variant === 'ERROR' ? 'alert' : 'status'}
      aria-live={variant === 'ERROR' ? 'assertive' : 'polite'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={getStackStyles()}
      className={cn(
        'absolute top-0 right-0 w-full bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden pointer-events-auto transition-all duration-300 ease-out',
        getVariantStyles(),
        isDismissing ? 'animate-toast-out' : 'animate-toast-in'
      )}
    >
      <div className="p-4 flex gap-3.5 relative">
        {/* Left Status Icon */}
        <div className="pt-0.5">{getIcon()}</div>

        {/* Content Info */}
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-xs font-bold text-slate-800 leading-tight">{title}</p>
          {message && (
            <p className="text-[11px] text-slate-500 mt-1 leading-normal break-words font-medium">
              {message}
            </p>
          )}

          {/* Action Trigger Buttons */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              {actions.map((act, i) =>
                act.url ? (
                  <Link
                    key={i}
                    href={act.url}
                    onClick={triggerDismiss}
                    className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100/80 rounded px-2.5 py-1 border border-blue-100/50 transition-colors"
                  >
                    {act.label}
                  </Link>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (act.onClick) act.onClick();
                      triggerDismiss();
                    }}
                    className="text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded px-2.5 py-1 border border-slate-200/50 transition-colors cursor-pointer"
                  >
                    {act.label}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={triggerDismiss}
          aria-label="Dismiss toast alert"
          className="absolute right-2 top-2 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Accessibly Hidden Shrinking Progress Bar */}
      {index === 0 && (
        <div
          className={cn(
            'absolute bottom-0 left-0 h-[3px] bg-slate-300/40 w-full transition-all duration-300'
          )}
          style={{ width: `${progress}%` }}
        />
      )}
    </div>
  );
}
