import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isVotingOpen } from '@/lib/timezone';
import { getAttendeeId } from '@/lib/cookies-server';

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
        registrations: {
          where: {
            isApproved: true,
          },
          select: {
            id: true,
            attendeeId: true,
            photoSelfieUrl: true,
            attendee: {
              select: {
                displayName: true,
              },
            },
          },
          take: 5, // Only fetch first 5 for avatars
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    // Get attendee IDs for each event to check if user has registered
    const attendeeChecks = await Promise.all(
      events.map(async (event) => ({
        eventId: event.id,
        attendeeId: await getAttendeeId(event.id),
      }))
    );

    // Add voting status and registration check to each event
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

      // Check if user has a registration for this event
      const attendeeCheck = attendeeChecks.find(check => check.eventId === event.id);
      const hasOwnRegistration = attendeeCheck?.attendeeId 
        ? event.registrations.some(reg => reg.attendeeId === attendeeCheck.attendeeId)
        : false;

      return {
        id: event.id,
        name: event.name,
        votingOpensAt: event.votingOpensAt.toISOString(),
        votingClosesAt: event.votingClosesAt?.toISOString() || null,
        isPublicGallery: event.isPublicGallery,
        registrationCount: event._count.registrations,
        registrationAvatars: event.registrations.map(reg => ({
          id: reg.id,
          photoSelfieUrl: reg.photoSelfieUrl,
          displayName: reg.attendee.displayName,
        })),
        status,
        votingOpen: votingStatus,
        hasOwnRegistration,
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

