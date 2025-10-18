import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendeeId } from '@/lib/cookies-server';
import { eventIdSchema } from '@/lib/validation';
import { z } from 'zod';

const querySchema = z.object({
  eventId: eventIdSchema,
});

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
        { success: false, error: 'INVALID_ATTENDEE' },
        { status: 401 }
      );
    }

    // Fetch all votes for this attendee in this event
    const votes = await prisma.vote.findMany({
      where: {
        eventId: validEventId,
        voterAttendeeId: attendeeId,
      },
      select: {
        category: true,
        targetRegistrationId: true,
      },
    });

    // Convert to a simple map of category -> registrationId
    const votesMap: Record<string, string> = {};
    votes.forEach((vote) => {
      votesMap[vote.category] = vote.targetRegistrationId;
    });

    return NextResponse.json({
      success: true,
      votes: votesMap,
    });
  } catch (error) {
    console.error('Fetch votes error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

