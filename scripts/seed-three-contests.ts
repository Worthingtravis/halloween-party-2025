import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample costume data for the ended contest
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

// Placeholder image URLs
const getPlaceholderImage = (index: number, type: 'selfie' | 'full') => {
  const seed = type === 'selfie' ? index : index + 100;
  return `https://picsum.photos/seed/${seed}/800/1200`;
};

async function main() {
  console.log('🌱 Starting seed with three contests...');

  // 1. Clear ALL existing data (in correct order due to foreign keys)
  console.log('\n🧹 Clearing ALL existing data...');
  await prisma.vote.deleteMany({});
  console.log('   ✓ Cleared votes');
  await prisma.registration.deleteMany({});
  console.log('   ✓ Cleared registrations');
  await prisma.attendee.deleteMany({});
  console.log('   ✓ Cleared attendees');
  await prisma.event.deleteMany({});
  console.log('   ✓ Cleared events');

  const now = new Date();
  
  // 2. Create three contests
  console.log('\n📅 Creating three contests...');

  // Contest 1: Starting Soon (in 2 days) - NO DATA
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  
  console.log('\n🔜 Contest 1: Starting Soon');
  const startingSoon = await prisma.event.create({
    data: {
      name: '🎃 Halloween Costume Contest 2024',
      votingOpensAt: twoDaysFromNow,
      votingClosesAt: fiveDaysFromNow,
      isPublicGallery: true,
    },
  });
  console.log(`   ✅ Created: "${startingSoon.name}"`);
  console.log(`   📍 Opens: ${twoDaysFromNow.toLocaleString()}`);
  console.log('   📊 No registrations (starting soon)');

  // Contest 2: In Progress (voting opened 1 hour ago) - NO DATA
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  
  console.log('\n🗳️  Contest 2: In Progress (Voting Open)');
  const inProgress = await prisma.event.create({
    data: {
      name: '👻 Office Halloween Party Voting',
      votingOpensAt: oneHourAgo,
      votingClosesAt: twoDaysLater,
      isPublicGallery: true,
    },
  });
  console.log(`   ✅ Created: "${inProgress.name}"`);
  console.log(`   📍 Opened: ${oneHourAgo.toLocaleString()}`);
  console.log(`   📍 Closes: ${twoDaysLater.toLocaleString()}`);
  console.log('   📊 No registrations yet');

  // Contest 3: Ended (voting closed yesterday) - WITH FULL MOCK DATA
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  console.log('\n🏁 Contest 3: Ended (With Mock Data)');
  const ended = await prisma.event.create({
    data: {
      name: '🕷️  Halloween 2023 - Best Costume Awards',
      votingOpensAt: sevenDaysAgo,
      votingClosesAt: yesterday,
      isPublicGallery: true,
    },
  });
  console.log(`   ✅ Created: "${ended.name}"`);
  console.log(`   📍 Opened: ${sevenDaysAgo.toLocaleString()}`);
  console.log(`   📍 Closed: ${yesterday.toLocaleString()}`);

  // Create attendees and registrations for the ENDED contest only
  console.log('\n   👥 Creating participants...');
  const attendees = [];
  const registrations = [];
  
  const numberOfParticipants = 13; // Create 13 costumes for a good display
  const selectedCostumes = costumeIdeas.slice(0, numberOfParticipants);
  
  for (let i = 0; i < selectedCostumes.length; i++) {
    const costume = selectedCostumes[i];
    
    // Create attendee
    const attendee = await prisma.attendee.create({
      data: {
        eventId: ended.id,
        displayName: costume.displayName,
      },
    });
    attendees.push(attendee);

    // Create registration (stagger creation times for proper ordering)
    const createdAt = new Date(sevenDaysAgo.getTime() + i * 60 * 60 * 1000); // 1 hour apart
    const registration = await prisma.registration.create({
      data: {
        eventId: ended.id,
        attendeeId: attendee.id,
        costumeTitle: costume.title,
        photoSelfieUrl: getPlaceholderImage(i, 'selfie'),
        photoFullUrl: getPlaceholderImage(i, 'full'),
        isApproved: true,
        createdAt,
      },
    });
    registrations.push(registration);
    
    console.log(`   ✓ ${i + 1}. ${costume.displayName} - "${costume.title}"`);
  }

  // Create votes for the ended contest
  console.log('\n   🗳️  Creating votes...');
  let totalVotes = 0;
  
  // Each attendee votes in all categories
  for (const voter of attendees) {
    // Shuffle registrations for each voter to create varied results
    const shuffledRegistrations = [...registrations].sort(() => Math.random() - 0.5);
    
    for (let catIndex = 0; catIndex < categories.length; catIndex++) {
      const category = categories[catIndex];
      // Vote for different registrations in each category
      const targetRegistration = shuffledRegistrations[catIndex % shuffledRegistrations.length];
      
      // Don't vote for yourself
      if (targetRegistration.attendeeId === voter.id) {
        const alternateIndex = (catIndex + 1) % shuffledRegistrations.length;
        const alternate = shuffledRegistrations[alternateIndex];
        if (alternate.attendeeId !== voter.id) {
          await prisma.vote.create({
            data: {
              eventId: ended.id,
              voterAttendeeId: voter.id,
              category,
              targetRegistrationId: alternate.id,
            },
          });
          totalVotes++;
        }
      } else {
        await prisma.vote.create({
          data: {
            eventId: ended.id,
            voterAttendeeId: voter.id,
            category,
            targetRegistrationId: targetRegistration.id,
          },
        });
        totalVotes++;
      }
    }
  }
  
  console.log(`   ✓ Created ${totalVotes} votes`);

  // Get and display winners for each category
  console.log('\n   🏆 Winners by Category:');
  const voteCounts = await prisma.vote.groupBy({
    by: ['category', 'targetRegistrationId'],
    where: { eventId: ended.id },
    _count: true,
  });
  
  for (const category of categories) {
    const categoryVotes = voteCounts.filter((v) => v.category === category);
    if (categoryVotes.length > 0) {
      const topVote = categoryVotes.sort((a, b) => b._count - a._count)[0];
      const winnerReg = registrations.find((r) => r.id === topVote.targetRegistrationId);
      const winnerAttendee = attendees.find((a) => a.id === winnerReg?.attendeeId);
      if (winnerReg && winnerAttendee) {
        console.log(`   🥇 ${category}: ${winnerAttendee.displayName} - "${winnerReg.costumeTitle}" (${topVote._count} votes)`);
      }
    }
  }

  // Final summary
  console.log('\n\n📊 Seeding Complete! Summary:');
  console.log('═══════════════════════════════════════════════════');
  const totalEvents = await prisma.event.count();
  const totalAttendees = await prisma.attendee.count();
  const totalRegistrations = await prisma.registration.count();
  const totalVotesCount = await prisma.vote.count();

  console.log(`📅 Total Events: ${totalEvents}`);
  console.log(`   1. "${startingSoon.name}" - Starting Soon (no data)`);
  console.log(`   2. "${inProgress.name}" - In Progress (no data)`);
  console.log(`   3. "${ended.name}" - Ended (with data)`);
  console.log(`\n👥 Total Attendees: ${totalAttendees} (all in ended contest)`);
  console.log(`🎭 Total Registrations: ${totalRegistrations} (all in ended contest)`);
  console.log(`🗳️  Total Votes: ${totalVotesCount} (all in ended contest)`);
  
  console.log('\n🎉 Success!');
  console.log('\n💡 Next steps:');
  console.log('   1. Run: pnpm dev');
  console.log('   2. Visit: http://localhost:3000');
  console.log('   3. You will see:');
  console.log('      • 1 contest starting soon (empty)');
  console.log('      • 1 contest in progress (empty - ready for registrations)');
  console.log('      • 1 ended contest (full data with winners)');
  console.log('\n📝 Note: Using placeholder images from picsum.photos');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

