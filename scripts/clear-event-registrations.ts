import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const eventId = args[0];

  if (!eventId) {
    console.error('❌ Missing event ID!');
    console.log('\n📖 Usage:');
    console.log('   pnpm tsx scripts/clear-event-registrations.ts <eventId>');
    console.log('\n   Example:');
    console.log('   pnpm tsx scripts/clear-event-registrations.ts e3f18ae7-a83b-4475-af45-65a306bd8acc');
    console.log('\n💡 This will clear all registrations, votes, and attendees for the event.');
    console.log('   The event itself will remain intact.');
    process.exit(1);
  }

  // Fetch the event
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      _count: {
        select: {
          registrations: true,
          votes: true,
          attendees: true,
        },
      },
    },
  });

  if (!event) {
    console.error(`❌ Event with ID "${eventId}" not found!`);
    console.log('\n💡 Make sure the event ID is correct.');
    process.exit(1);
  }

  // Display event info
  console.log('\n🎯 Target Event:');
  console.log(`   Name: ${event.name}`);
  console.log(`   ID: ${event.id}`);
  console.log(`   Voting Opens: ${event.votingOpensAt.toLocaleString()}`);
  console.log(`   Voting Closes: ${event.votingClosesAt ? event.votingClosesAt.toLocaleString() : 'Never'}`);
  console.log('');
  console.log('📊 Current Data:');
  console.log(`   Registrations: ${event._count.registrations}`);
  console.log(`   Votes: ${event._count.votes}`);
  console.log(`   Attendees: ${event._count.attendees}`);
  console.log('');

  if (event._count.registrations === 0 && event._count.votes === 0 && event._count.attendees === 0) {
    console.log('✅ Event is already empty - nothing to clear!');
    process.exit(0);
  }

  console.log('⚠️  WARNING: This will DELETE all registrations, votes, and attendees for this event!');
  console.log('   The event itself will remain, but all participant data will be removed.');
  console.log('');
  console.log('🚀 Starting cleanup in 2 seconds... (press Ctrl+C to cancel)');
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🧹 Clearing event data...');

  // Delete in correct order due to foreign key constraints
  
  // 1. Delete votes first (references registrations and attendees)
  const deletedVotes = await prisma.vote.deleteMany({
    where: { eventId },
  });
  console.log(`   ✓ Deleted ${deletedVotes.count} votes`);

  // 2. Delete registrations (references attendees and event)
  const deletedRegistrations = await prisma.registration.deleteMany({
    where: { eventId },
  });
  console.log(`   ✓ Deleted ${deletedRegistrations.count} registrations`);

  // 3. Delete attendees (references event)
  const deletedAttendees = await prisma.attendee.deleteMany({
    where: { eventId },
  });
  console.log(`   ✓ Deleted ${deletedAttendees.count} attendees`);

  console.log('\n✅ Event cleared successfully!');
  console.log('');
  console.log('📊 Final Status:');
  console.log(`   Event: "${event.name}" (still exists)`);
  console.log(`   Registrations: 0`);
  console.log(`   Votes: 0`);
  console.log(`   Attendees: 0`);
  console.log('');
  console.log('🎉 Done! The event is now ready for fresh registrations.');
  console.log('');
  console.log('💡 Next steps:');
  console.log(`   Visit: https://halloween-party-2025-two.vercel.app/r/${eventId}`);
  console.log('   New participants can now register for this event.');
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

