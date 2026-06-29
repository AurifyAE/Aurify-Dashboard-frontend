'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LiveClockProps {
  className?: string;
  style?: React.CSSProperties;
  timeZone?: string;
  /** @deprecated use variant="datetime" */
  showDate?: boolean;
  variant?: 'time' | 'date' | 'datetime';
}

const PLACEHOLDER = '--:--';

function formatClock(
  now: Date,
  timeZone?: string,
  variant: 'time' | 'date' | 'datetime' = 'time'
): string {
  try {
    if (variant === 'date') {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(now);
    }
    if (variant === 'datetime') {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(now);
    }
    if (timeZone) {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(now);
    }
    return now.toLocaleTimeString();
  } catch {
    return PLACEHOLDER;
  }
}

/** Stable SSR placeholder, live updates after mount — avoids hydration mismatch. */
export default function LiveClock({
  className,
  style,
  timeZone,
  showDate,
  variant,
}: LiveClockProps) {
  const resolvedVariant = variant ?? (showDate ? 'datetime' : 'time');
  const [text, setText] = useState(PLACEHOLDER);

  useEffect(() => {
    const update = () => setText(formatClock(new Date(), timeZone, resolvedVariant));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [timeZone, resolvedVariant]);

  return (
    <span className={cn(className)} style={style}>
      {text}
    </span>
  );
}
