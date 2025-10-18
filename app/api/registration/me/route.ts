import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendeeId } from '@/lib/cookies-server';
import { eventIdSchema } from '@/lib/validation';
import { z } from 'zod';

const querySchema = z.object({
  eventId: eventIdSchema,
});

/**
 * GET /api/registration/me
 * Returns the current user's registration for an event
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    const validation = querySchema.safeParse({ eventId });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { eventId: validEventId } = validation.data;

    // Get attendee ID from cookie
    const attendeeId = await getAttendeeId(validEventId);
    
    if (!attendeeId) {
      return NextResponse.json(
        { success: false, error: 'NO_ATTENDEE' },
        { status: 401 }
      );
    }

    // Get attendee info
    const attendee = await prisma.attendee.findUnique({
      where: {
        id: attendeeId,
      },
      select: {
        displayName: true,
      },
    });

    // Find the user's registration for this event
    const registration = await prisma.registration.findFirst({
      where: {
        eventId: validEventId,
        attendeeId: attendeeId,
      },
      select: {
        id: true,
        costumeTitle: true,
        photoSelfieUrl: true,
        photoFullUrl: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!registration) {
      return NextResponse.json({
        success: true,
        hasRegistration: false,
        displayName: attendee?.displayName || null,
      });
    }

    return NextResponse.json({
      success: true,
      hasRegistration: true,
      registration: {
        id: registration.id,
        costumeTitle: registration.costumeTitle,
        photoSelfieUrl: registration.photoSelfieUrl,
        photoFullUrl: registration.photoFullUrl,
        isApproved: registration.isApproved,
        createdAt: registration.createdAt,
        updatedAt: registration.updatedAt,
      },
      displayName: attendee?.displayName || null,
    });
  } catch (error) {
    console.error('Fetch user registration error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

