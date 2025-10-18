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
          flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium
          transition-all duration-200
          ${selected
            ? 'bg-primary text-primary-foreground shadow-md scale-105'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        style={selected ? { backgroundColor: config.color } : {}}
      >
        <span className="text-lg">{config.icon}</span>
        <span>{config.label}</span>
      </button>
    );
  }

  if (variant === 'result') {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2 ${className}`}
        style={{ borderColor: config.color }}
      >
        <span className="text-2xl">{config.icon}</span>
        <div className="flex-1">
          <p className="font-semibold">{config.label}</p>
          {count !== undefined && (
            <p className="text-sm text-muted-foreground">{count} votes</p>
          )}
        </div>
      </div>
    );
  }

  // Badge variant (compact)
  return (
    <Badge
      variant={selected ? 'default' : 'secondary'}
      className={`gap-1 ${className}`}
      style={selected ? { backgroundColor: config.color } : {}}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {count !== undefined && <span>({count})</span>}
    </Badge>
  );
}

