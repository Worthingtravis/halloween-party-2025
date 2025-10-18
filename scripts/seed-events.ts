import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding events...');

  // Clear existing events (optional - comment out if you want to keep existing data)
  // await prisma.event.deleteMany({});

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Create test events with different statuses
  const events = [
    {
      name: '🎃 Halloween Party 2024',
      votingOpensAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago (VOTING OPEN)
      votingClosesAt: tomorrow,
      isPublicGallery: true,
    },
    {
      name: '👻 Spooky Office Contest',
      votingOpensAt: tomorrow, // Opens tomorrow (REGISTRATION)
      votingClosesAt: nextWeek,
      isPublicGallery: true,
    },
    {
      name: '🦇 Virtual Halloween Bash',
      votingOpensAt: nextWeek, // Opens next week (UPCOMING)
      votingClosesAt: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      isPublicGallery: false,
    },
    {
      name: '🕷️ Best Costume 2023',
      votingOpensAt: lastWeek, // Opened last week (CLOSED)
      votingClosesAt: yesterday,
      isPublicGallery: true,
    },
  ];

  for (const eventData of events) {
    const event = await prisma.event.create({
      data: eventData,
    });
    console.log(`✅ Created event: ${event.name} (${event.id})`);
  }

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

