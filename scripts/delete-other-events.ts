import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const keepEventId = args[0];

  if (!keepEventId) {
    console.error('❌ Missing event ID to keep!');
    console.log('\n📖 Usage:');
    console.log('   pnpm run delete-other-events <eventIdToKeep>');
    console.log('\n   Example:');
    console.log('   pnpm run delete-other-events 9c9bdd34-05e1-4b02-8887-80e4faa45e55');
    console.log('\n💡 This will delete ALL events EXCEPT the one you specify.');
    process.exit(1);
  }

  // Fetch all events
  const allEvents = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
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

  if (allEvents.length === 0) {
    console.log('✅ No events found in database - nothing to delete!');
    process.exit(0);
  }

  // Find the event to keep
  const keepEvent = allEvents.find((e) => e.id === keepEventId);
  
  if (!keepEvent) {
    console.error(`❌ Event with ID "${keepEventId}" not found!`);
    console.log('\n📅 Available events:');
    allEvents.forEach((event) => {
      console.log(`   - ${event.name} (${event.id})`);
    });
    process.exit(1);
  }

  // Find events to delete
  const eventsToDelete = allEvents.filter((e) => e.id !== keepEventId);

  if (eventsToDelete.length === 0) {
    console.log('✅ No other events to delete - only the specified event exists!');
    console.log(`\n📍 Keeping: "${keepEvent.name}" (${keepEvent.id})`);
    process.exit(0);
  }

  // Display summary
  console.log('\n🎯 KEEPING this event:');
  console.log(`   ✓ ${keepEvent.name}`);
  console.log(`     ID: ${keepEvent.id}`);
  console.log(`     Registrations: ${keepEvent._count.registrations}`);
  console.log(`     Votes: ${keepEvent._count.votes}`);
  console.log('');
  
  console.log('🗑️  DELETING these events:');
  eventsToDelete.forEach((event) => {
    console.log(`   ✗ ${event.name}`);
    console.log(`     ID: ${event.id}`);
    console.log(`     Registrations: ${event._count.registrations}`);
    console.log(`     Votes: ${event._count.votes}`);
    console.log('');
  });

  console.log(`⚠️  WARNING: This will DELETE ${eventsToDelete.length} event(s) and all their data!`);
  console.log('   (Registrations, votes, attendees, and the events themselves)');
  console.log('');
  console.log('🚀 Starting deletion in 2 seconds... (press Ctrl+C to cancel)');
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🧹 Deleting events...');

  let totalDeletedVotes = 0;
  let totalDeletedRegistrations = 0;
  let totalDeletedAttendees = 0;

  for (const event of eventsToDelete) {
    console.log(`\n   Processing: "${event.name}"`);
    
    // Delete votes
    const deletedVotes = await prisma.vote.deleteMany({
      where: { eventId: event.id },
    });
    totalDeletedVotes += deletedVotes.count;
    console.log(`     ✓ Deleted ${deletedVotes.count} votes`);

    // Delete registrations
    const deletedRegistrations = await prisma.registration.deleteMany({
      where: { eventId: event.id },
    });
    totalDeletedRegistrations += deletedRegistrations.count;
    console.log(`     ✓ Deleted ${deletedRegistrations.count} registrations`);

    // Delete attendees
    const deletedAttendees = await prisma.attendee.deleteMany({
      where: { eventId: event.id },
    });
    totalDeletedAttendees += deletedAttendees.count;
    console.log(`     ✓ Deleted ${deletedAttendees.count} attendees`);

    // Delete the event itself
    await prisma.event.delete({
      where: { id: event.id },
    });
    console.log(`     ✓ Deleted event`);
  }

  console.log('\n✅ Deletion complete!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Events deleted: ${eventsToDelete.length}`);
  console.log(`   Total votes deleted: ${totalDeletedVotes}`);
  console.log(`   Total registrations deleted: ${totalDeletedRegistrations}`);
  console.log(`   Total attendees deleted: ${totalDeletedAttendees}`);
  console.log('');
  console.log('🎉 Done!');
  console.log('');
  console.log(`📍 Remaining event: "${keepEvent.name}"`);
  console.log(`   ID: ${keepEvent.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

