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

      // Create a map of registration ID to vote count
      const voteMap = new Map<string, number>();
      categoryVotes.forEach((vote) => {
        voteMap.set(vote.targetRegistrationId, vote._count._all);
      });

      // Build entries for all registrations, including those with 0 votes
      const allEntries = registrations.map((reg) => {
        const votes = voteMap.get(reg.id) || 0;
        return {
          registration: reg,
          votes,
        };
      });

      // Sort by votes (descending), then by earliest registration time
      allEntries.sort((a, b) => {
        if (b.votes !== a.votes) {
          return b.votes - a.votes;
        }
        return a.registration.createdAt.getTime() - b.registration.createdAt.getTime();
      });

      // Find the maximum vote count
      const maxVotes = allEntries.length > 0 ? allEntries[0].votes : 0;

      // Find all entries with max votes (winners)
      const winners = allEntries.filter((entry) => entry.votes === maxVotes && entry.votes > 0);

      return {
        category,
        entries: allEntries.map((entry) => ({
          id: entry.registration.id,
          costumeTitle: entry.registration.costumeTitle,
          displayName: entry.registration.attendee.displayName,
          photoSelfieUrl: entry.registration.photoSelfieUrl,
          photoFullUrl: entry.registration.photoFullUrl,
          voteCount: entry.votes,
          isWinner: entry.votes === maxVotes && entry.votes > 0,
        })),
        maxVotes,
        isTie: winners.length > 1,
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

