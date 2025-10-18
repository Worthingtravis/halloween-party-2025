import { z } from 'zod';

/**
 * Validate UUID format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Category enum (matches database)
 */
export const CATEGORIES = ['funniest', 'scariest', 'cutest', 'personalFavorite'] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Validate category enum
 */
export function isValidCategory(category: string): category is Category {
  return CATEGORIES.includes(category as Category);
}

/**
 * Category configuration for UI
 */
export const CATEGORY_CONFIG = {
  funniest: { label: 'Funniest', icon: '😂', color: '#FCD34D' },
  scariest: { label: 'Scariest', icon: '👻', color: '#A78BFA' },
  cutest: { label: 'Cutest', icon: '🥰', color: '#F9A8D4' },
  personalFavorite: { label: 'Personal Favorite', icon: '⭐', color: '#FB923C' },
} as const;

/**
 * Zod schemas for validation
 */
export const displayNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(255, 'Name must be less than 255 characters');

export const costumeTitleSchema = z
  .string()
  .min(1, 'Costume title is required')
  .max(255, 'Costume title must be less than 255 characters');

export const eventIdSchema = z.string().uuid('Invalid event ID');
export const attendeeIdSchema = z.string().uuid('Invalid attendee ID');
export const categorySchema = z.enum(CATEGORIES);

/**
 * Validate display name
 */
export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const result = displayNameSchema.safeParse(name);
  return result.success
    ? { valid: true }
    : { valid: false, error: result.error.errors[0].message };
}

/**
 * Validate costume title
 */
export function validateCostumeTitle(title: string): { valid: boolean; error?: string } {
  const result = costumeTitleSchema.safeParse(title);
  return result.success
    ? { valid: true }
    : { valid: false, error: result.error.errors[0].message };
}

