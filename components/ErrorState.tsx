import React from 'react';
import { Button } from '@/components/ui/button';
import { getUserFriendlyMessage } from '@/lib/error-messages';

export type ErrorVariant = 'page' | 'inline' | 'toast';

interface ErrorStateProps {
  error?: Error | { message?: string; code?: string };
  retry?: () => void;
  variant?: ErrorVariant;
  recoverable?: boolean;
  className?: string;
}

/**
 * ErrorState - Reusable error display component
 * 
 * @example
 * ```tsx
 * <ErrorState 
 *   error={error} 
 *   retry={() => refetch()} 
 *   variant="page" 
 * />
 * ```
 */
export function ErrorState({
  error,
  retry,
  variant = 'inline',
  recoverable = true,
  className = '',
}: ErrorStateProps) {
  const errorCode = error && typeof error === 'object' && 'code' in error 
    ? error.code as string 
    : undefined;
  
  const errorMessage = error && typeof error === 'object' && 'message' in error
    ? error.message
    : 'Something went wrong';

  const displayMessage = errorCode 
    ? getUserFriendlyMessage(errorCode)
    : errorMessage;

  if (variant === 'page') {
    return (
      <div className={`flex min-h-[400px] flex-col items-center justify-center gap-4 ${className}`}>
        <div className="text-6xl">😕</div>
        <h2 className="text-2xl font-bold">Oops!</h2>
        <p className="max-w-md text-center text-muted-foreground">{displayMessage}</p>
        {recoverable && retry && (
          <Button onClick={retry} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'toast') {
    // This is used with the toast component
    return (
      <div className="flex items-center gap-2">
        <span>⚠️</span>
        <span>{displayMessage}</span>
      </div>
    );
  }

  // Inline variant
  return (
    <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <p className="text-sm text-red-800">{displayMessage}</p>
          {recoverable && retry && (
            <Button
              onClick={retry}
              variant="ghost"
              size="sm"
              className="mt-2 h-auto p-0 text-red-800 hover:text-red-900"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

