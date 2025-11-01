import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CATEGORIES } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get all votes for this event grouped by category and registration
    const voteCounts = await prisma.vote.groupBy({
      by: ['category', 'targetRegistrationId'],
      where: { eventId },
      _count: {
        _all: true,
      },
    });

    // Get all registrations for this event to include registration details
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
      orderBy: {
        createdAt: 'asc', // For tie-breaking
      },
    });

    // Build results by category
    const results = CATEGORIES.map((category) => {
      // Get all votes for this category
      const categoryVotes = voteCounts.filter((v) => v.category === category);

      if (categoryVotes.length === 0) {
        return {
          category,
          winner: null,
          voteCount: 0,
          isTie: false,
        };
      }

      // Find the maximum vote count
      const maxVotes = Math.max(...categoryVotes.map((v) => v._count._all));

      // Find all registrations with the max vote count (for tie detection)
      const topVotes = categoryVotes.filter((v) => v._count._all === maxVotes);

      // Get the winner(s) with registration details
      const winnerCandidates = topVotes
        .map((vote) => {
          const reg = registrations.find((r) => r.id === vote.targetRegistrationId);
          return reg ? { registration: reg, votes: vote._count._all } : null;
        })
        .filter((c) => c !== null);

      if (winnerCandidates.length === 0) {
        return {
          category,
          winner: null,
          voteCount: 0,
          isTie: false,
        };
      }

      // If there's a tie, use earliest registration time as tiebreaker
      const winner = winnerCandidates.sort((a, b) => {
        return a!.registration.createdAt.getTime() - b!.registration.createdAt.getTime();
      })[0]!;

      const isTie = winnerCandidates.length > 1;

      return {
        category,
        winner: {
          id: winner.registration.id,
          costumeTitle: winner.registration.costumeTitle,
          displayName: winner.registration.attendee.displayName,
          photoSelfieUrl: winner.registration.photoSelfieUrl,
          photoFullUrl: winner.registration.photoFullUrl,
        },
        voteCount: winner.votes,
        isTie,
      };
    });

    return NextResponse.json({
      eventId,
      results,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}

