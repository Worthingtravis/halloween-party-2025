'use client';

import React, { useEffect, useState } from 'react';
import { getTimeRemaining, formatEventTime } from '@/lib/timezone';
import { Card } from '@/components/ui/card';

export type TimerVariant = 'overlay' | 'inline' | 'compact';

interface CountdownTimerProps {
  targetDate: string | Date; // UTC ISO string or Date
  onComplete?: () => void;
  variant?: TimerVariant;
  timezone?: string;
  className?: string;
}

/**
 * CountdownTimer - Real-time countdown with timezone support
 * 
 * @example
 * ```tsx
 * <CountdownTimer 
 *   targetDate={event.votingOpensAt} 
 *   variant="overlay"
 *   onComplete={() => window.location.reload()}
 * />
 * ```
 */
export function CountdownTimer({
  targetDate,
  onComplete,
  variant = 'inline',
  className = '',
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(targetDate));
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining(targetDate);
      setTimeLeft(remaining);

      if (remaining.total <= 0 && !hasCompleted) {
        setHasCompleted(true);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onComplete, hasCompleted]);

  if (timeLeft.total <= 0) {
    return null; // Timer complete
  }

  const timeUnits = [
    { value: timeLeft.days, label: 'days', short: 'd' },
    { value: timeLeft.hours, label: 'hours', short: 'h' },
    { value: timeLeft.minutes, label: 'minutes', short: 'm' },
    { value: timeLeft.seconds, label: 'seconds', short: 's' },
  ];

  if (variant === 'overlay') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm ${className}`}>
        <Card className="mx-4 max-w-md p-8 text-center">
          <h2 className="mb-2 text-2xl font-bold">Voting Opens In</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {formatEventTime(targetDate)}
          </p>
          <div className="grid grid-cols-4 gap-4">
            {timeUnits.map((unit) => (
              <div key={unit.label} className="flex flex-col">
                <span className="text-3xl font-bold">{unit.value}</span>
                <span className="text-xs text-muted-foreground">{unit.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 text-sm ${className}`}>
        <span className="text-muted-foreground">Opens in:</span>
        {timeUnits
          .filter((unit) => unit.value > 0)
          .slice(0, 2)
          .map((unit, idx) => (
            <React.Fragment key={unit.label}>
              {idx > 0 && <span>,</span>}
              <span className="font-semibold">
                {unit.value}
                {unit.short}
              </span>
            </React.Fragment>
          ))}
      </div>
    );
  }

  // Inline variant
  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="mb-2 text-center font-semibold">Voting Opens In</h3>
      <div className="grid grid-cols-4 gap-2 text-center">
        {timeUnits.map((unit) => (
          <div key={unit.label}>
            <div className="text-2xl font-bold">{unit.value}</div>
            <div className="text-xs text-muted-foreground">{unit.label}</div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {formatEventTime(targetDate)}
      </p>
    </Card>
  );
}

