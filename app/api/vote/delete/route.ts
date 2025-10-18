import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendeeId } from '@/lib/cookies-server';
import { isVotingOpen } from '@/lib/timezone';
import { categorySchema, eventIdSchema } from '@/lib/validation';
import { z } from 'zod';

const requestSchema = z.object({
  eventId: eventIdSchema,
  voterAttendeeId: z.string().uuid(),
  category: categorySchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: validation.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { eventId, voterAttendeeId, category } = validation.data;

    // Validate cookie matches
    const cookieAttendeeId = await getAttendeeId(eventId);
    if (cookieAttendeeId !== voterAttendeeId) {
      return NextResponse.json(
        { success: false, error: 'INVALID_ATTENDEE' },
        { status: 401 }
      );
    }

    // Check if event exists and voting is open
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    if (!isVotingOpen(event)) {
      return NextResponse.json(
        { success: false, error: 'VOTING_CLOSED', message: 'Voting window is not open' },
        { status: 409 }
      );
    }

    // Delete the vote
    await prisma.vote.deleteMany({
      where: {
        eventId,
        voterAttendeeId,
        category,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vote removed',
    });
  } catch (error) {
    console.error('Unvote error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

