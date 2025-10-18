import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendeeId } from '@/lib/cookies';

/**
 * Deterministic shuffle using seed
 */
function seededShuffle<T>(array: T[], seed: string): T[] {
  const arr = [...array];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Fisher-Yates shuffle with seeded random
  const random = (max: number) => {
    hash = (hash * 9301 + 49297) % 233280;
    return (hash / 233280) * max;
  };
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Get attendee ID from cookie for deterministic shuffle
    const attendeeId = getAttendeeId(eventId);
    if (!attendeeId) {
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

    // Deterministic shuffle based on eventId + attendeeId
    const seed = `${eventId}-${attendeeId}`;
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
    });
  } catch (error) {
    console.error('Registration list error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

