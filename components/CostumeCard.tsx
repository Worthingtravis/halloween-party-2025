import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type CardVariant = 'swipeable' | 'static' | 'compact';

interface Registration {
  id: string;
  costumeTitle: string;
  displayName: string;
  photoSelfieUrl: string;
  photoFullUrl: string;
}

interface CostumeCardProps {
  registration: Registration;
  variant?: CardVariant;
  showDisplayName?: boolean;
  onSwipe?: (direction: 'left' | 'right') => void;
  onClick?: () => void;
  className?: string;
}

/**
 * CostumeCard - Reusable costume display card
 * 
 * Used in: Voting flow, Results display, Admin moderation, Registration review
 * 
 * @example
 * ```tsx
 * <CostumeCard 
 *   registration={reg} 
 *   variant="swipeable"
 *   onSwipe={(dir) => handleSwipe(dir)}
 * />
 * ```
 */
export function CostumeCard({
  registration,
  variant = 'static',
  showDisplayName = true,
  onSwipe,
  onClick,
  className = '',
}: CostumeCardProps) {
  const handleClick = () => {
    onClick?.();
  };

  if (variant === 'compact') {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.98] touch-manipulation ${className}`}
        onClick={handleClick}
      >
        <CardContent className="flex items-center gap-3 p-3 sm:p-4">
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
            <AvatarImage src={registration.photoSelfieUrl} alt={registration.costumeTitle} />
            <AvatarFallback>{registration.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {registration.costumeTitle}
            </h3>
            {showDisplayName && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {registration.displayName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'swipeable') {
    // For voting UI - larger, more prominent, optimized for mobile touch
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={registration.photoFullUrl}
            alt={registration.costumeTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            priority
            loading="eager"
          />
        </div>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl line-clamp-2">
            {registration.costumeTitle}
          </CardTitle>
          {showDisplayName && (
            <p className="text-sm sm:text-base text-muted-foreground truncate">
              {registration.displayName}
            </p>
          )}
        </CardHeader>
      </Card>
    );
  }

  // Static variant - default, mobile-optimized
  return (
    <Card
      className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg active:scale-[0.98] ${className}`}
      onClick={handleClick}
    >
      <div className="relative aspect-square w-full">
        <Image
          src={registration.photoFullUrl}
          alt={registration.costumeTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
        />
      </div>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
            <AvatarImage src={registration.photoSelfieUrl} alt={registration.displayName} />
            <AvatarFallback>{registration.displayName[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {registration.costumeTitle}
            </h3>
            {showDisplayName && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {registration.displayName}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

