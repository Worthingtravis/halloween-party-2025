import React from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// Preload ghost image
const ghostImage = '/ghost.png';

export type LoadingVariant = 'spinner' | 'skeleton' | 'progress';
export type LoadingSize = 'sm' | 'md' | 'lg';

interface LoadingStateProps {
  variant?: LoadingVariant;
  size?: LoadingSize;
  message?: string;
  progress?: number; // 0-100 for progress bar
  className?: string;
}

const sizeClasses = {
  sm: { width: 32, height: 32 },
  md: { width: 64, height: 64 },
  lg: { width: 96, height: 96 },
};

/**
 * LoadingState - Reusable loading component
 * 
 * @example
 * ```tsx
 * <LoadingState variant="spinner" size="md" message="Loading..." />
 * <LoadingState variant="progress" progress={75} />
 * <LoadingState variant="skeleton" />
 * ```
 */
export function LoadingState({
  variant = 'spinner',
  size = 'md',
  message,
  progress = 0,
  className = '',
}: LoadingStateProps) {
  if (variant === 'spinner') {
    const dimensions = sizeClasses[size];
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
        <div
          className="animate-spin"
          role="status"
          aria-label="Loading"
        >
          <Image
            src={ghostImage}
            alt="Loading..."
            width={dimensions.width}
            height={dimensions.height}
            priority
          />
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    );
  }

  if (variant === 'progress') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <Progress value={progress} className="w-full" />
        {message && (
          <p className="text-sm text-center text-muted-foreground">
            {message} {progress > 0 && `(${Math.round(progress)}%)`}
          </p>
        )}
      </div>
    );
  }

  // Skeleton variant
  return (
    <div className={`space-y-4 ${className}`}>
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

