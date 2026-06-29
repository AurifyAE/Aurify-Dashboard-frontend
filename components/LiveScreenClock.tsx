'use client';

import LiveClock from '@/components/LiveClock';

interface LiveScreenClockProps {
  accent?: string;
}

export function LiveScreenClock({ accent }: LiveScreenClockProps) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-5 py-4 text-right">
      <LiveClock variant="date" className="block text-sm text-white/60" />
      <LiveClock
        variant="time"
        className="block text-3xl font-semibold"
        style={accent ? { color: accent } : undefined}
      />
    </div>
  );
}
