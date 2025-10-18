import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setAttendeeCookie } from '@/lib/cookies-server';
import { eventIdSchema, attendeeIdSchema } from '@/lib/validation';
import { z } from 'zod';

const requestSchema = z.object({
  eventId: eventIdSchema,
  displayName: z.string().min(1).max(255),
  attendeeId: attendeeIdSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    const { eventId, displayName, attendeeId } = validation.data;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    // Upsert attendee
    const attendee = await prisma.attendee.upsert({
      where: {
        id: attendeeId || crypto.randomUUID(),
      },
      update: {
        displayName,
      },
      create: {
        id: crypto.randomUUID(),
        eventId,
        displayName,
      },
    });

    // Set cookie
    setAttendeeCookie(eventId, attendee.id);

    return NextResponse.json({
      success: true,
      attendeeId: attendee.id,
    });
  } catch (error) {
    console.error('Attendee upsert error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

