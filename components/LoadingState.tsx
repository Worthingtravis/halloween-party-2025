import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

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
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
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
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
        <div
          className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-primary`}
          role="status"
          aria-label="Loading"
        />
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

