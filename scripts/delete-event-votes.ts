import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Event ID to remove votes for
const EVENT_ID = 'e3f18ae7-a83b-4475-af45-65a306bd8acc';

async function main() {
  console.log('🗑️  Starting vote deletion...');
  console.log(`📍 Event ID: ${EVENT_ID}`);

  // First check if the event exists
  const event = await prisma.event.findUnique({
    where: { id: EVENT_ID },
    select: { 
      id: true,
      name: true,
      votingOpensAt: true,
      votingClosesAt: true,
    },
  });

  if (!event) {
    console.error(`\n❌ Error: Event with ID "${EVENT_ID}" not found.`);
    process.exit(1);
  }

  console.log(`\n✅ Found event: "${event.name}"`);
  console.log(`   Voting opens: ${event.votingOpensAt.toLocaleString()}`);
  console.log(`   Voting closes: ${event.votingClosesAt?.toLocaleString() || 'Not set'}`);

  // Count votes before deletion
  const voteCount = await prisma.vote.count({
    where: { eventId: EVENT_ID },
  });

  if (voteCount === 0) {
    console.log('\n⚠️  No votes found for this event.');
    return;
  }

  console.log(`\n🔍 Found ${voteCount} vote(s) to delete`);

  // Get breakdown by category
  const voteCounts = await prisma.vote.groupBy({
    by: ['category'],
    where: { eventId: EVENT_ID },
    _count: true,
  });

  console.log('\n📊 Votes by category:');
  for (const categoryCount of voteCounts) {
    console.log(`   ${categoryCount.category}: ${categoryCount._count} vote(s)`);
  }

  // Delete all votes for this event
  console.log('\n🗑️  Deleting votes...');
  const result = await prisma.vote.deleteMany({
    where: { eventId: EVENT_ID },
  });

  console.log(`\n✅ Successfully deleted ${result.count} vote(s)!`);
  
  // Verify deletion
  const remainingVotes = await prisma.vote.count({
    where: { eventId: EVENT_ID },
  });

  if (remainingVotes === 0) {
    console.log('✅ Verification: No votes remain for this event.');
  } else {
    console.error(`⚠️  Warning: ${remainingVotes} vote(s) still found after deletion.`);
  }

  console.log('\n🎉 Vote deletion complete!');
}

main()
  .catch((e) => {
    console.error('\n❌ Vote deletion failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


