import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isVotingOpen } from '@/lib/timezone';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    const votingOpen = isVotingOpen(event);
    const now = new Date();

    return NextResponse.json({
      success: true,
      votingOpen,
      opensAtUTC: event.votingOpensAt.toISOString(),
      closesAtUTC: event.votingClosesAt?.toISOString() || null,
      nowUTC: now.toISOString(),
    });
  } catch (error) {
    console.error('Event status error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

