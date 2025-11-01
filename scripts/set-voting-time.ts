import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const eventIdArg = args[0];
  const dateTimeArg = args[1]; // Format: "2025-10-31T23:00:00Z" or "2025-10-31 23:00"

  if (!eventIdArg || !dateTimeArg) {
    console.error('❌ Missing arguments!');
    console.log('\n📖 Usage:');
    console.log('   pnpm run set-voting-time <eventId> <datetime>');
    console.log('\n   Example:');
    console.log('   pnpm run set-voting-time 9c9bdd34-05e1-4b02-8887-80e4faa45e55 "2025-10-31T23:00:00Z"');
    console.log('   pnpm run set-voting-time 9c9bdd34-05e1-4b02-8887-80e4faa45e55 "2025-10-31 23:00"');
    console.log('\n💡 This will set when voting opens for the event.');
    process.exit(1);
  }

  // Find the event
  const event = await prisma.event.findUnique({
    where: { id: eventIdArg },
  });

  if (!event) {
    console.error(`❌ Event with ID "${eventIdArg}" not found!`);
    process.exit(1);
  }

  // Parse the datetime
  let newVotingOpensAt: Date;
  try {
    newVotingOpensAt = new Date(dateTimeArg);
    if (isNaN(newVotingOpensAt.getTime())) {
      throw new Error('Invalid date');
    }
  } catch (e) {
    console.error(`❌ Invalid datetime format: "${dateTimeArg}"`);
    console.log('\n💡 Use ISO format: "2025-10-31T23:00:00Z" or "2025-10-31 23:00"');
    process.exit(1);
  }

  const now = new Date();
  
  console.log('\n📊 Current Event Status:');
  console.log(`   Name: ${event.name}`);
  console.log(`   ID: ${event.id}`);
  console.log(`   Current Voting Opens: ${event.votingOpensAt.toLocaleString()}`);
  console.log(`   Current Voting Closes: ${event.votingClosesAt ? event.votingClosesAt.toLocaleString() : 'Never'}`);
  console.log('');
  console.log('🔄 New Settings:');
  console.log(`   New Voting Opens: ${newVotingOpensAt.toLocaleString()}`);
  console.log(`   Status now: ${now >= newVotingOpensAt ? '🗳️  VOTING' : '📝 REGISTRATION'}`);
  console.log('');

  // Update the event
  await prisma.event.update({
    where: { id: eventIdArg },
    data: {
      votingOpensAt: newVotingOpensAt,
    },
  });

  console.log('✅ Voting time updated successfully!');
  console.log('');
  console.log('🎉 Done!');
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Visit your event page to verify');
  console.log(`   2. Registration URL: https://halloween-party-2025-two.vercel.app/r/${event.id}`);
  console.log(`   3. Voting URL: https://halloween-party-2025-two.vercel.app/v/${event.id}`);
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

