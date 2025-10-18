import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatEventTime } from '@/lib/timezone';

export type EventStatus = 'upcoming' | 'registration' | 'voting' | 'closed';

interface Event {
  id: string;
  name: string;
  votingOpensAt: string;
  votingClosesAt?: string | null;
  registrationCount: number;
  status: EventStatus;
  votingOpen: boolean;
  hasOwnRegistration: boolean;
}

interface EventCardProps {
  event: Event;
  className?: string;
}

const statusConfig = {
  upcoming: {
    label: 'Coming Soon',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
  },
  registration: {
    label: 'Registration Open',
    color: 'bg-green-500',
    textColor: 'text-green-500',
  },
  voting: {
    label: 'Voting Open',
    color: 'bg-amber-500',
    textColor: 'text-amber-500',
  },
  closed: {
    label: 'Ended',
    color: 'bg-gray-500',
    textColor: 'text-gray-500',
  },
};

/**
 * EventCard - Display event with status and action buttons
 */
export function EventCard({ event, className = '' }: EventCardProps) {
  const config = statusConfig[event.status];

  const getPrimaryAction = () => {
    if (event.status === 'closed') {
      return {
        href: `/results/${event.id}`,
        label: 'View Results',
        variant: 'outline' as const,
      };
    }
    if (event.status === 'voting') {
      return {
        href: `/v/${event.id}`,
        label: 'Vote Now',
        variant: 'default' as const,
      };
    }
    // registration or upcoming
    // Show different text if user already has a registration
    if (event.hasOwnRegistration) {
      return {
        href: `/r/${event.id}`,
        label: 'View My Costume',
        variant: 'outline' as const,
      };
    }
    return {
      href: `/r/${event.id}`,
      label: 'Register Costume',
      variant: 'default' as const,
    };
  };

  const action = getPrimaryAction();

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${className}`}>
      <CardHeader className="pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl line-clamp-2">{event.name}</CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              {event.status === 'voting' || event.status === 'closed' ? (
                <>Voting: {formatEventTime(event.votingOpensAt)}</>
              ) : (
                <>Opens: {formatEventTime(event.votingOpensAt)}</>
              )}
            </CardDescription>
          </div>
          <Badge className={`${config.color} text-white text-xs shrink-0`}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="text-base">👥</span>
            <span className="text-xs sm:text-sm">
              {event.registrationCount} {event.registrationCount === 1 ? 'costume' : 'costumes'}
            </span>
          </div>
          {event.votingOpen && (
            <div className="flex items-center gap-1.5">
              <span className="text-base">🗳️</span>
              <span className="text-xs sm:text-sm font-medium text-green-600">
                Vote now!
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild className="flex-1 min-h-[44px] sm:min-h-[40px]" variant={action.variant}>
            <Link href={action.href}>{action.label}</Link>
          </Button>
          {event.status !== 'closed' && 
           event.registrationCount > 0 && 
           !(event.status === 'voting' && event.hasOwnRegistration) && (
            <Button
              asChild
              variant="outline"
              size="icon"
              className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]"
            >
              <Link href={`/v/${event.id}`} aria-label="View gallery">
                👁️
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

