import { formatInTimeZone, toDate } from 'date-fns-tz';
import { differenceInMilliseconds } from 'date-fns';

const VANCOUVER_TZ = 'America/Vancouver';

/**
 * Convert UTC ISO string to America/Vancouver Date
 */
export function utcToLocal(utcDate: string): Date {
  return toDate(utcDate, { timeZone: VANCOUVER_TZ });
}

/**
 * Check if current time is within voting window
 */
export function isVotingOpen(event: {
  votingOpensAt: string | Date;
  votingClosesAt?: string | Date | null;
}): boolean {
  const now = new Date();
  const opensAt = typeof event.votingOpensAt === 'string' 
    ? new Date(event.votingOpensAt) 
    : event.votingOpensAt;

  if (now < opensAt) return false;

  if (event.votingClosesAt) {
    const closesAt = typeof event.votingClosesAt === 'string'
      ? new Date(event.votingClosesAt)
      : event.votingClosesAt;
    if (now > closesAt) return false;
  }

  return true;
}

/**
 * Format date for display ("Oct 31, 2024 8:00 PM PDT")
 */
export function formatEventTime(utcDate: string | Date): string {
  return formatInTimeZone(utcDate, VANCOUVER_TZ, 'MMM d, yyyy h:mm a zzz');
}

/**
 * Calculate time remaining until target date
 */
export function getTimeRemaining(targetDate: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = new Date();
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const total = differenceInMilliseconds(target, now);

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

