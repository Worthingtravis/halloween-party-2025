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

