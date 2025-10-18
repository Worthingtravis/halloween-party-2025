import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample data
const costumeIdeas = [
  { title: 'Spooky Ghost', displayName: 'Sarah Mitchell' },
  { title: 'Vampire Count', displayName: 'Marcus Chen' },
  { title: 'Zombie Cheerleader', displayName: 'Emily Rodriguez' },
  { title: 'Pirate Captain', displayName: 'James Wilson' },
  { title: 'Scary Clown', displayName: 'Lisa Anderson' },
  { title: 'Black Cat', displayName: 'Maria Santos' },
  { title: 'Frankenstein', displayName: 'David Kim' },
  { title: 'Mummy', displayName: 'Jennifer Lee' },
  { title: 'Witch on Broomstick', displayName: 'Amanda Taylor' },
  { title: 'Skeleton Warrior', displayName: 'Michael Brown' },
  { title: 'Cute Pumpkin', displayName: 'Sophie Martin' },
  { title: 'Dracula', displayName: 'Robert Garcia' },
  { title: 'Werewolf', displayName: 'Jessica White' },
  { title: 'Headless Horseman', displayName: 'Daniel Thompson' },
  { title: 'Creepy Doll', displayName: 'Ashley Davis' },
];

const categories: Array<'funniest' | 'scariest' | 'cutest' | 'personalFavorite'> = [
  'funniest',
  'scariest',
  'cutest',
  'personalFavorite',
];

// Placeholder image URLs (using placeholder services)
const getPlaceholderImage = (index: number, type: 'selfie' | 'full') => {
  const seed = type === 'selfie' ? index : index + 100;
  // Using picsum.photos for placeholder images
  return `https://picsum.photos/seed/${seed}/800/1200`;
};

async function main() {
  console.log('🌱 Starting comprehensive seeding...');

  // Clear existing data (in correct order due to foreign keys)
  console.log('🧹 Cleaning existing data...');
  await prisma.vote.deleteMany({});
  await prisma.registration.deleteMany({});
  await prisma.attendee.deleteMany({});
  await prisma.event.deleteMany({});

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Create events with different statuses
  const events = [
    {
      name: '🎃 Halloween Party 2024 - Main Event',
      votingOpensAt: twoHoursAgo, // Voting is OPEN
      votingClosesAt: inTwoHours, // Will close in 2 hours
      isPublicGallery: true,
      costumeCount: 12, // Most costumes
    },
    {
      name: '👻 Spooky Office Contest',
      votingOpensAt: tomorrow, // Opens tomorrow (REGISTRATION)
      votingClosesAt: nextWeek,
      isPublicGallery: true,
      costumeCount: 8,
    },
    {
      name: '🦇 Virtual Halloween Bash',
      votingOpensAt: nextWeek, // Opens next week (UPCOMING)
      votingClosesAt: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
      isPublicGallery: false,
      costumeCount: 5,
    },
    {
      name: '🕷️ Best Costume 2023',
      votingOpensAt: lastWeek, // Opened last week (CLOSED)
      votingClosesAt: yesterday,
      isPublicGallery: true,
      costumeCount: 10, // Has votes and results
    },
  ];

  for (const eventData of events) {
    const { costumeCount, ...eventFields } = eventData;
    
    console.log(`\n📅 Creating event: ${eventData.name}`);
    const event = await prisma.event.create({
      data: eventFields,
    });
    console.log(`   ✅ Event ID: ${event.id}`);

    // Create attendees and registrations for this event
    const attendees = [];
    const registrations = [];
    
    const selectedCostumes = costumeIdeas.slice(0, costumeCount);
    
    for (let i = 0; i < selectedCostumes.length; i++) {
      const costume = selectedCostumes[i];
      
      // Create attendee
      const attendee = await prisma.attendee.create({
        data: {
          eventId: event.id,
          displayName: costume.displayName,
        },
      });
      attendees.push(attendee);

      // Create registration
      const registration = await prisma.registration.create({
        data: {
          eventId: event.id,
          attendeeId: attendee.id,
          costumeTitle: costume.title,
          photoSelfieUrl: getPlaceholderImage(i, 'selfie'),
          photoFullUrl: getPlaceholderImage(i, 'full'),
          isApproved: true,
          // Stagger creation times for tie-breaking
          createdAt: new Date(now.getTime() - (selectedCostumes.length - i) * 60000),
        },
      });
      registrations.push(registration);
      
      console.log(`   👤 ${costume.displayName} - "${costume.title}"`);
    }

    // Create votes for closed or active voting events
    if (event.votingOpensAt <= now) {
      console.log(`   🗳️  Creating votes...`);
      
      // Each attendee votes in all categories
      for (const voter of attendees) {
        // Shuffle registrations for each voter to create varied results
        const shuffledRegistrations = [...registrations].sort(() => Math.random() - 0.5);
        
        for (let catIndex = 0; catIndex < categories.length; catIndex++) {
          const category = categories[catIndex];
          // Vote for different registrations in each category
          const targetRegistration = shuffledRegistrations[catIndex % shuffledRegistrations.length];
          
          // Don't vote for yourself (skip if same)
          if (targetRegistration.attendeeId === voter.id) {
            const alternateIndex = (catIndex + 1) % shuffledRegistrations.length;
            const alternate = shuffledRegistrations[alternateIndex];
            if (alternate.attendeeId !== voter.id) {
              await prisma.vote.create({
                data: {
                  eventId: event.id,
                  voterAttendeeId: voter.id,
                  category,
                  targetRegistrationId: alternate.id,
                },
              });
            }
          } else {
            await prisma.vote.create({
              data: {
                eventId: event.id,
                voterAttendeeId: voter.id,
                category,
                targetRegistrationId: targetRegistration.id,
              },
            });
          }
        }
      }
      
      // Get vote counts for this event
      const voteCounts = await prisma.vote.groupBy({
        by: ['category', 'targetRegistrationId'],
        where: { eventId: event.id },
        _count: true,
      });
      
      console.log(`   ✓ Created ${voteCounts.length} vote records`);
      
      // Show winners per category
      for (const category of categories) {
        const categoryVotes = voteCounts.filter((v) => v.category === category);
        if (categoryVotes.length > 0) {
          const topVote = categoryVotes.sort((a, b) => b._count - a._count)[0];
          const winnerReg = registrations.find((r) => r.id === topVote.targetRegistrationId);
          if (winnerReg) {
            console.log(`   🏆 ${category}: "${winnerReg.costumeTitle}" (${topVote._count} votes)`);
          }
        }
      }
    } else {
      console.log(`   ⏳ Voting not open yet - no votes created`);
    }
  }

  // Print summary
  console.log('\n📊 Seeding Summary:');
  const totalEvents = await prisma.event.count();
  const totalAttendees = await prisma.attendee.count();
  const totalRegistrations = await prisma.registration.count();
  const totalVotes = await prisma.vote.count();

  console.log(`   📅 Events: ${totalEvents}`);
  console.log(`   👥 Attendees: ${totalAttendees}`);
  console.log(`   🎭 Registrations: ${totalRegistrations}`);
  console.log(`   🗳️  Votes: ${totalVotes}`);
  
  console.log('\n🎉 Comprehensive seeding complete!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: pnpm dev');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. See events with real data!');
  console.log('\n📝 Note: Using placeholder images from picsum.photos');
  console.log('   In production, replace with actual uploaded photos.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

