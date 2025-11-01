import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const action = args[0]; // 'close' or 'open'
  const eventIdArg = args[1]; // optional event ID

  if (!action || !['close', 'open'].includes(action)) {
    console.error('❌ Invalid usage!');
    console.log('\n📖 Usage:');
    console.log('   pnpm tsx scripts/toggle-voting.ts close [eventId]');
    console.log('   pnpm tsx scripts/toggle-voting.ts open [eventId]');
    console.log('\n   If eventId is not provided, you can select from a list.');
    process.exit(1);
  }

  // Fetch all events
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          registrations: true,
          votes: true,
        },
      },
    },
  });

  if (events.length === 0) {
    console.error('❌ No events found in database!');
    console.log('💡 Run a seeder first: pnpm tsx scripts/seed-halloween-2025.ts');
    process.exit(1);
  }

  let targetEvent;

  // If eventId provided, find that event
  if (eventIdArg) {
    targetEvent = events.find((e) => e.id === eventIdArg);
    if (!targetEvent) {
      console.error(`❌ Event with ID "${eventIdArg}" not found!`);
      process.exit(1);
    }
  } else {
    // Show list of events
    console.log('\n📅 Available Events:\n');
    const now = new Date();
    
    events.forEach((event, index) => {
      const status = getEventStatus(event, now);
      console.log(`${index + 1}. ${event.name}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Status: ${status}`);
      console.log(`   Opens: ${event.votingOpensAt.toLocaleString()}`);
      console.log(`   Closes: ${event.votingClosesAt ? event.votingClosesAt.toLocaleString() : 'Never'}`);
      console.log(`   Registrations: ${event._count.registrations} | Votes: ${event._count.votes}`);
      console.log('');
    });

    // For now, just use the first (most recent) event
    targetEvent = events[0];
    console.log(`🎯 Using most recent event: "${targetEvent.name}"\n`);
  }

  const now = new Date();
  const currentStatus = getEventStatus(targetEvent, now);

  console.log('📊 Current Event Status:');
  console.log(`   Name: ${targetEvent.name}`);
  console.log(`   Status: ${currentStatus}`);
  console.log(`   Voting Opens: ${targetEvent.votingOpensAt.toLocaleString()}`);
  console.log(`   Voting Closes: ${targetEvent.votingClosesAt ? targetEvent.votingClosesAt.toLocaleString() : 'Never'}`);
  console.log('');

  if (action === 'close') {
    console.log('🔒 Closing voting...');
    
    // Set votingClosesAt to now (or 1 second ago to be safe)
    const closeTime = new Date(now.getTime() - 1000);
    
    await prisma.event.update({
      where: { id: targetEvent.id },
      data: {
        votingClosesAt: closeTime,
      },
    });

    console.log('✅ Voting closed successfully!');
    console.log(`   Closed at: ${closeTime.toLocaleString()}`);
    console.log(`   Status is now: ENDED`);
    
  } else if (action === 'open') {
    console.log('🔓 Opening voting...');
    
    // Set votingOpensAt to now (or 1 second ago to be safe)
    // Set votingClosesAt to 7 days from now
    const openTime = new Date(now.getTime() - 1000);
    const closeTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    await prisma.event.update({
      where: { id: targetEvent.id },
      data: {
        votingOpensAt: openTime,
        votingClosesAt: closeTime,
      },
    });

    console.log('✅ Voting opened successfully!');
    console.log(`   Opened at: ${openTime.toLocaleString()}`);
    console.log(`   Will close at: ${closeTime.toLocaleString()}`);
    console.log(`   Status is now: VOTING`);
  }

  console.log('\n🎉 Done!');
  console.log('\n💡 Next steps:');
  console.log('   1. Visit your app to see the changes');
  console.log('   2. Run this script again to toggle back:');
  console.log(`      pnpm tsx scripts/toggle-voting.ts ${action === 'close' ? 'open' : 'close'} ${targetEvent.id}`);
}

function getEventStatus(event: any, now: Date): string {
  const opensAt = new Date(event.votingOpensAt);
  const closesAt = event.votingClosesAt ? new Date(event.votingClosesAt) : null;

  if (closesAt && now > closesAt) {
    return '🏁 ENDED';
  } else if (now >= opensAt && (!closesAt || now < closesAt)) {
    return '🗳️  VOTING';
  } else if (now < opensAt) {
    return '📝 REGISTRATION';
  }
  return '❓ UNKNOWN';
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

