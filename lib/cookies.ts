import { cookies } from 'next/headers';

/**
 * Set attendee cookie with proper security flags
 * Used after attendee registration
 */
export function setAttendeeCookie(eventId: string, attendeeId: string): void {
  cookies().set(`attendee_${eventId}`, attendeeId, {
    maxAge: 2592000, // 30 days
    sameSite: 'lax',
    secure: true,
    path: '/',
    httpOnly: false, // Allow client-side read for React components
  });
}

/**
 * Get attendee ID from cookie for current event (SERVER-SIDE)
 * Returns null if cookie doesn't exist
 */
export function getAttendeeId(eventId: string): string | null {
  return cookies().get(`attendee_${eventId}`)?.value ?? null;
}

/**
 * Clear attendee cookie (for testing/logout)
 */
export function clearAttendeeCookie(eventId: string): void {
  cookies().delete(`attendee_${eventId}`);
}

/**
 * Get attendee ID from cookie (CLIENT-SIDE)
 * Use this in React components
 */
export function getAttendeeCookieClient(eventId: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`attendee_${eventId}=`))
    ?.split('=')[1];
  
  return value ?? null;
}

