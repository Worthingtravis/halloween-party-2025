import { cookies } from 'next/headers';

/**
 * Set attendee cookie with proper security flags
 * Used after attendee registration
 * SERVER-SIDE ONLY
 */
export async function setAttendeeCookie(eventId: string, attendeeId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`attendee_${eventId}`, attendeeId, {
    maxAge: 31536000000, // ~1000 years (essentially permanent)
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
export async function getAttendeeId(eventId: string): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(`attendee_${eventId}`)?.value ?? null;
}

/**
 * Clear attendee cookie (for testing/logout)
 * SERVER-SIDE ONLY
 */
export async function clearAttendeeCookie(eventId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(`attendee_${eventId}`);
}

