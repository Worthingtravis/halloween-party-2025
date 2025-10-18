import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isVotingOpen } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    // Fetch all events, ordered by voting opens date
    const events = await prisma.event.findMany({
      orderBy: {
        votingOpensAt: 'desc',
      },
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                isApproved: true,
              },
            },
          },
        },
      },
    });

    // Add voting status to each event
    const eventsWithStatus = events.map((event) => {
      const votingStatus = isVotingOpen(event);
      const now = new Date();
      const opensAt = new Date(event.votingOpensAt);
      const closesAt = event.votingClosesAt ? new Date(event.votingClosesAt) : null;

      let status: 'upcoming' | 'registration' | 'voting' | 'closed';
      if (closesAt && now > closesAt) {
        status = 'closed';
      } else if (votingStatus) {
        status = 'voting';
      } else if (now < opensAt) {
        status = 'registration';
      } else {
        status = 'upcoming';
      }

      return {
        id: event.id,
        name: event.name,
        votingOpensAt: event.votingOpensAt.toISOString(),
        votingClosesAt: event.votingClosesAt?.toISOString() || null,
        isPublicGallery: event.isPublicGallery,
        registrationCount: event._count.registrations,
        status,
        votingOpen: votingStatus,
      };
    });

    return NextResponse.json({
      success: true,
      events: eventsWithStatus,
    });
  } catch (error) {
    console.error('Events list error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

