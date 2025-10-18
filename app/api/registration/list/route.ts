import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendeeId } from '@/lib/cookies-server';

/**
 * Deterministic shuffle using seed
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  if (array.length <= 1) return [...array];
  
  const arr = [...array];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Ensure hash is positive
  hash = Math.abs(hash);
  
  // Fisher-Yates shuffle with seeded random
  const random = () => {
    hash = (hash * 9301 + 49297) % 233280;
    return hash / 233280;
  };
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');
    const publicAccess = searchParams.get('public') === 'true';

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Check event status to determine if public access is allowed
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get attendee ID from cookie for deterministic shuffle (optional for public access)
    const attendeeId = await getAttendeeId(eventId);
    
    // Allow access without attendee ID if:
    // 1. publicAccess flag is set AND
    // 2. Voting has closed (event ended)
    const votingClosed = event.votingClosesAt && new Date() > event.votingClosesAt;
    const allowPublicAccess = publicAccess && votingClosed;

    if (!attendeeId && !allowPublicAccess) {
      return NextResponse.json(
        { success: false, error: 'No attendee cookie found' },
        { status: 401 }
      );
    }

    // Get approved registrations
    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        isApproved: true,
      },
      include: {
        attendee: {
          select: {
            displayName: true,
          },
        },
      },
    });

    // Check if current attendee has a registration
    const hasOwnRegistration = attendeeId 
      ? registrations.some(reg => reg.attendeeId === attendeeId)
      : false;

    // Deterministic shuffle based on eventId + attendeeId (or just eventId for public)
    const seed = attendeeId ? `${eventId}-${attendeeId}` : eventId;
    const shuffled = seededShuffle(registrations, seed);

    // Format response
    const formatted = shuffled.map((reg) => ({
      id: reg.id,
      costumeTitle: reg.costumeTitle,
      photoSelfieUrl: reg.photoSelfieUrl,
      photoFullUrl: reg.photoFullUrl,
      displayName: reg.attendee.displayName,
    }));

    return NextResponse.json({
      success: true,
      registrations: formatted,
      hasOwnRegistration,
    });
  } catch (error) {
    console.error('Registration list error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

