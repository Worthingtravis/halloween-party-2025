# Seed Scripts

This directory contains database seeding scripts for testing and development.

## Available Scripts

### 🌱 `pnpm seed` - Complete Application Seed

**File:** `seed-complete.ts`

Creates a fully populated database with realistic test data:

- **4 Events** with different statuses:
  - 🎃 Active voting event (12 costumes, votes in progress)
  - 👻 Registration open event (8 costumes, no votes yet)
  - 🦇 Upcoming event (5 costumes)
  - 🕷️ Past event (10 costumes, voting closed)

- **35+ Attendees** across all events
- **35+ Costume Registrations** with placeholder images
- **100+ Votes** distributed across categories

**Features:**
- Realistic costume titles and attendee names
- Varied vote distributions for each category
- Staggered creation times for tie-breaking
- Winner calculations for closed events
- Placeholder images from picsum.photos

**Usage:**
```bash
pnpm seed
```

**Output:**
- Summary of created records
- Winners per category for active/closed events
- Next steps to view the app

---

### 🎯 `pnpm seed:three` - Three Contests Setup

**File:** `seed-three-contests.ts`

Creates a clean slate with exactly 3 contests in different states:

1. **🔜 Starting Soon** - Contest opens in 2 days (EMPTY - no registrations)
2. **🗳️ In Progress** - Voting opened 1 hour ago (EMPTY - ready for new registrations)
3. **🏁 Ended** - Voting closed yesterday (FULL DATA - 13 costumes with votes and winners)

**Features:**
- ✅ Clears ALL existing data first
- ✅ Only the ended contest has mock data
- ✅ Perfect for testing different contest states
- ✅ Clean setup for demos and development

**Usage:**
```bash
pnpm seed:three
```

**Output:**
- Summary of all 3 contests created
- Winners displayed for the ended contest
- Clear indication of which contests have data

---

### 📅 `pnpm seed:events` - Events Only

**File:** `seed-events.ts`

Creates only 4 sample events with different statuses.
No attendees, registrations, or votes.

**Usage:**
```bash
pnpm seed:events
```

**Use Case:** Quick event setup for testing event listing

---

## After Seeding

1. **Start the dev server:**
   ```bash
   pnpm dev
   ```

2. **Visit the home page:**
   ```
   http://localhost:3000
   ```

3. **Explore the app:**
   - Browse events on home page
   - View costume galleries
   - See vote counts (for closed events)
   - Test the voting flow (for active events)

---

## Notes

### Placeholder Images

The seed script uses `https://picsum.photos` for placeholder images:
- Selfie photos: `https://picsum.photos/seed/{N}/800/1200`
- Full photos: `https://picsum.photos/seed/{N+100}/800/1200`

In production, these should be replaced with actual uploaded photos.

### Database Reset

Both seed scripts **delete all existing data** before seeding.

⚠️ **Warning:** Do not run these scripts in production!

### Vote Distribution

- Each attendee votes in all 4 categories
- Votes are randomized but deterministic per run
- Winners are calculated based on:
  1. Most votes in category
  2. Tie-breaker: Earliest registration time
  3. Tie-breaker: Lowest registration ID (UUID)

---

## Customization

To modify the seed data, edit:

- **Costume ideas:** `costumeIdeas` array in `seed-complete.ts`
- **Event timing:** Date calculations at the top of `main()`
- **Vote patterns:** Vote creation logic in the events loop
- **Image sources:** `getPlaceholderImage()` function

---

## Troubleshooting

### "Table doesn't exist" error
```bash
pnpm prisma migrate dev
```

### "Connection refused" error
Check your `.env` file has correct `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING`

### Want to keep existing data?
Comment out the delete statements at the top of `main()`:
```typescript
// await prisma.vote.deleteMany({});
// await prisma.registration.deleteMany({});
// ...
```

