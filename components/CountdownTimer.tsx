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
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 ${className}`}>
        <Card className="w-full max-w-md p-4 sm:p-8 text-center">
          <h2 className="mb-2 text-xl sm:text-2xl font-bold">Voting Opens In</h2>
          <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-muted-foreground">
            {formatEventTime(targetDate)}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:gap-4">
            {timeUnits.map((unit) => (
              <div key={unit.label} className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-bold">{unit.value}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 text-xs sm:text-sm flex-wrap ${className}`}>
        <span className="text-muted-foreground">Opens in:</span>
        {timeUnits
          .filter((unit) => unit.value > 0)
          .slice(0, 2)
          .map((unit, idx) => (
            <React.Fragment key={unit.label}>
              {idx > 0 && <span className="hidden sm:inline">,</span>}
              <span className="font-semibold whitespace-nowrap">
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
    <Card className={`p-3 sm:p-4 ${className}`}>
      <h3 className="mb-2 text-center text-sm sm:text-base font-semibold">
        Voting Opens In
      </h3>
      <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
        {timeUnits.map((unit) => (
          <div key={unit.label}>
            <div className="text-xl sm:text-2xl font-bold">{unit.value}</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 sm:mt-4 text-center text-[10px] sm:text-xs text-muted-foreground">
        {formatEventTime(targetDate)}
      </p>
    </Card>
  );
}

