import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendeeId } from '@/lib/cookies-server';
import { isVotingOpen } from '@/lib/timezone';
import { categorySchema, eventIdSchema } from '@/lib/validation';
import { z } from 'zod';

const requestSchema = z.object({
  eventId: eventIdSchema,
  voterAttendeeId: z.uuid(),
  category: categorySchema,
  targetRegistrationId: z.uuid(),
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

    const { eventId, voterAttendeeId, category, targetRegistrationId } = validation.data;

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

    // Use transaction to ensure atomicity and prevent race conditions
    const vote = await prisma.$transaction(async (tx) => {
      // Check if this voter has already voted for this costume in ANY other category
      const existingVoteForSameCostume = await tx.vote.findFirst({
        where: {
          eventId,
          voterAttendeeId,
          targetRegistrationId,
          category: {
            not: category, // Different category
          },
        },
      });

      if (existingVoteForSameCostume) {
        // Automatically delete the old vote to allow moving to new category
        await tx.vote.delete({
          where: {
            votes_unique: {
              eventId,
              voterAttendeeId,
              category: existingVoteForSameCostume.category,
            },
          },
        });
      }

      // Check if vote already exists for this attendee in this category
      const existingVote = await tx.vote.findUnique({
        where: {
          votes_unique: {
            eventId,
            voterAttendeeId,
            category,
          },
        },
      });

      if (existingVote) {
        // Update existing vote
        return await tx.vote.update({
          where: {
            votes_unique: {
              eventId,
              voterAttendeeId,
              category,
            },
          },
          data: {
            targetRegistrationId,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new vote
        return await tx.vote.create({
          data: {
            id: crypto.randomUUID(),
            eventId,
            voterAttendeeId,
            category,
            targetRegistrationId,
          },
        });
      }
    }, {
      isolationLevel: 'Serializable', // Prevent race conditions
      maxWait: 5000, // Maximum wait time in ms
      timeout: 10000, // Maximum execution time in ms
    });

    return NextResponse.json({
      success: true,
      message: 'Vote recorded',
      voteId: vote.id,
    });
  } catch (error) {
    console.error('Vote error:', error);
    
    // Handle specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      // P2002: Unique constraint violation
      if (error.code === 'P2002') {
        return NextResponse.json(
          { success: false, error: 'DUPLICATE_VOTE', message: 'Vote already exists for this category' },
          { status: 409 }
        );
      }
      // P2034: Transaction conflict (serialization failure)
      if (error.code === 'P2034') {
        return NextResponse.json(
          { success: false, error: 'CONCURRENT_REQUEST', message: 'Please try again in a moment' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR', message: 'Failed to record vote. Please try again.' },
      { status: 500 }
    );
  }
}

