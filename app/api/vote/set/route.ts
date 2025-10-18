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
  targetRegistrationId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS', message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { eventId, voterAttendeeId, category, targetRegistrationId } = validation.data;

    // Validate cookie matches
    const cookieAttendeeId = getAttendeeId(eventId);
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

    // Validate target registration exists and is approved
    const targetRegistration = await prisma.registration.findUnique({
      where: { id: targetRegistrationId },
    });

    if (!targetRegistration || !targetRegistration.isApproved) {
      return NextResponse.json(
        { success: false, error: 'INVALID_REGISTRATION' },
        { status: 400 }
      );
    }

    // Validate registration belongs to same event
    if (targetRegistration.eventId !== eventId) {
      return NextResponse.json(
        { success: false, error: 'Cross-event voting not allowed' },
        { status: 400 }
      );
    }

    // Upsert vote (replaces previous vote in same category)
    const vote = await prisma.vote.upsert({
      where: {
        eventId_voterAttendeeId_category: {
          eventId,
          voterAttendeeId,
          category,
        },
      },
      update: {
        targetRegistrationId,
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        eventId,
        voterAttendeeId,
        category,
        targetRegistrationId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Vote recorded',
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

