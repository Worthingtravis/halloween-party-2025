import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Creating Halloween 2025 Event...');

  // October 31st, 2025 at 10:00 PM (22:00)
  const votingOpensAt = new Date('2025-10-31T22:00:00.000Z'); // UTC
  
  // Voting will close 2 days later (Nov 2nd at 10pm)
  const votingClosesAt = new Date('2025-11-02T22:00:00.000Z');

  const event = await prisma.event.create({
    data: {
      name: '🎃 Halloween Costume Contest 2025',
      votingOpensAt,
      votingClosesAt,
      isPublicGallery: true,
    },
  });

  console.log(`✅ Created event: "${event.name}"`);
  console.log(`📍 Event ID: ${event.id}`);
  console.log(`📅 Voting Opens: ${votingOpensAt.toLocaleString()} UTC`);
  console.log(`📅 Voting Closes: ${votingClosesAt.toLocaleString()} UTC`);
  console.log(`📝 Registration Status: OPEN (voting starts in ~8 days)`);
  console.log(`🎭 Ready for costume registrations!`);
  
  console.log('\n🎉 Event created successfully!');
  console.log('\n💡 Next steps:');
  console.log('   1. Share registration link: http://localhost:3000/r/' + event.id);
  console.log('   2. Participants can register their costumes now');
  console.log('   3. Voting will open automatically on Oct 31st at 10pm');
}

main()
  .catch((e) => {
    console.error('❌ Event creation failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

