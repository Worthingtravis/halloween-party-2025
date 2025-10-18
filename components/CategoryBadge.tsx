import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Category, CATEGORY_CONFIG } from '@/lib/validation';

export type BadgeVariant = 'pill' | 'badge' | 'result';

interface CategoryBadgeProps {
  category: Category;
  selected?: boolean;
  count?: number; // Vote count for results
  onClick?: () => void;
  variant?: BadgeVariant;
  disabled?: boolean;
  className?: string;
}

/**
 * CategoryBadge - Reusable category display component
 * 
 * Used in voting UI, results page, and "My picks" summary
 * 
 * @example
 * ```tsx
 * <CategoryBadge category="funniest" variant="pill" selected onClick={handleClick} />
 * <CategoryBadge category="scariest" variant="result" count={15} />
 * ```
 */
export function CategoryBadge({
  category,
  selected = false,
  count,
  onClick,
  variant = 'pill',
  disabled = false,
  className = '',
}: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];

  if (variant === 'pill') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 sm:gap-2 rounded-full px-3 py-2.5 sm:px-4 sm:py-2
          text-xs sm:text-sm font-medium
          transition-all duration-200 touch-manipulation
          min-h-[44px] sm:min-h-[40px]
          ${selected
            ? 'bg-primary text-primary-foreground shadow-md scale-105'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        style={selected ? { backgroundColor: config.color } : {}}
      >
        <span className="text-base sm:text-lg">{config.icon}</span>
        <span className="whitespace-nowrap">{config.label}</span>
      </button>
    );
  }

  if (variant === 'result') {
    return (
      <div
        className={`flex items-center gap-2 sm:gap-3 rounded-lg border-2 px-3 py-2 sm:px-4 sm:py-3 ${className}`}
        style={{ borderColor: config.color }}
      >
        <span className="text-xl sm:text-2xl">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm sm:text-base truncate">{config.label}</p>
          {count !== undefined && (
            <p className="text-xs sm:text-sm text-muted-foreground">
              {count} {count === 1 ? 'vote' : 'votes'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Badge variant (compact)
  return (
    <Badge
      variant={selected ? 'default' : 'secondary'}
      className={`gap-1 text-xs sm:text-sm ${className}`}
      style={selected ? { backgroundColor: config.color } : {}}
    >
      <span className="text-sm sm:text-base">{config.icon}</span>
      <span className="whitespace-nowrap">{config.label}</span>
      {count !== undefined && <span>({count})</span>}
    </Badge>
  );
}

