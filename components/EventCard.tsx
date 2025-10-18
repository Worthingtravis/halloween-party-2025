'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatEventTime } from '@/lib/timezone';

export type EventStatus = 'upcoming' | 'registration' | 'voting' | 'closed';

interface Event {
  id: string;
  name: string;
  votingOpensAt: string;
  votingClosesAt?: string | null;
  registrationCount: number;
  registrationAvatars: Array<{
    id: string;
    photoSelfieUrl: string;
    displayName: string;
  }>;
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
  const [showQRCode, setShowQRCode] = useState(false);
  const config = statusConfig[event.status];
  
  // Get full URL for QR code
  const registrationUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/r/${event.id}`
    : '';

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
        {/* Stats - Overlapping Avatars */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            {event.registrationCount > 0 ? (
              <>
                <div className="flex -space-x-2">
                  {event.registrationAvatars.slice(0, 4).map((avatar) => (
                    <Avatar 
                      key={avatar.id} 
                      className="h-8 w-8 border-2 border-background ring-1 ring-border"
                    >
                      <AvatarImage 
                        src={avatar.photoSelfieUrl} 
                        alt={avatar.displayName}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xs">
                        {avatar.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {event.registrationCount > 4 && (
                    <div className="h-8 w-8 rounded-full border-2 border-background ring-1 ring-border bg-muted flex items-center justify-center text-xs font-medium">
                      +{event.registrationCount - 4}
                    </div>
                  )}
                </div>
                <span className="text-xs sm:text-sm ml-1">
                  {event.registrationCount} {event.registrationCount === 1 ? 'costume' : 'costumes'}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-sm">No costumes yet</span>
            )}
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
          
          {/* QR Code Button - Always visible */}
          <Button
            variant="outline"
            size="icon"
            className="min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px]"
            onClick={() => setShowQRCode(true)}
            aria-label="Show QR code"
          >
            <QrCode className="h-5 w-5" />
          </Button>
          
          {/* Gallery Button */}
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

      {/* QR Code Modal */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Register with QR Code</DialogTitle>
            <DialogDescription className="text-center">
              Scan this code to register your costume for {event.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-6">
            {/* QR Code */}
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={registrationUrl}
                size={256}
                level="M"
                includeMargin={false}
              />
            </div>
            {/* Event Name */}
            <div className="text-center space-y-2">
              <p className="font-semibold text-lg">{event.name}</p>
              <p className="text-sm text-muted-foreground">
                Opens: {formatEventTime(event.votingOpensAt)}
              </p>
            </div>
            {/* URL Display */}
            <div className="w-full">
              <p className="text-xs text-center text-muted-foreground break-all px-4">
                {registrationUrl}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

