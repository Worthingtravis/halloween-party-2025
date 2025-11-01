# Halloween App Architecture - Shared Components & Logic

## Overview
This document identifies reusable components, shared logic, and one-off implementations to guide development and maintain consistency across the app.

---

## 🧩 Shared UI Components

### High Priority - Build First

#### 1. **CostumeCard** 
**Used in:** Voting flow, Results display, Admin moderation, Registration review
**Location:** `/components/CostumeCard.tsx`
**Props:**
```typescript
interface CostumeCardProps {
  registration: {
    id: string;
    costumeTitle: string;
    displayName: string;
    photoSelfieUrl: string;
    photoFullUrl: string;
  };
  variant: 'swipeable' | 'static' | 'compact';
  showDisplayName?: boolean;
  onSwipe?: (direction: 'left' | 'right') => void;
  onClick?: () => void;
  className?: string;
}
```
**Variants:**
- `swipeable`: Tinder-style cards in voting flow
- `static`: Results display and registration review
- `compact`: Admin moderation list view

**Features:**
- Responsive image loading with Next.js Image
- Lazy loading for performance
- Accessibility support (ARIA labels, keyboard navigation)
- Touch gesture support for mobile

---

#### 2. **CategoryBadge**
**Used in:** Voting UI (selection pills), Results display, "My picks" summary
**Location:** `/components/CategoryBadge.tsx`
**Props:**
```typescript
type Category = 'funniest' | 'scariest' | 'cutest' | 'personalFavorite';

interface CategoryBadgeProps {
  category: Category;
  selected?: boolean;
  count?: number; // Vote count for results
  onClick?: () => void;
  variant: 'pill' | 'badge' | 'result';
  disabled?: boolean;
}
```
**Features:**
- Consistent category colors/icons across app
- Animated selection states
- Accessible focus states
- Optional vote count display

**Category Mapping:**
```typescript
const CATEGORY_CONFIG = {
  funniest: { label: 'Funniest', icon: '😂', color: 'yellow' },
  scariest: { label: 'Scariest', icon: '👻', color: 'purple' },
  cutest: { label: 'Cutest', icon: '🥰', color: 'pink' },
  personalFavorite: { label: 'Personal Favorite', icon: '⭐', color: 'orange' }
} as const;
```

---

#### 3. **CountdownTimer**
**Used in:** Voting page (pre-open), Registration page (if time-limited)
**Location:** `/components/CountdownTimer.tsx`
**Props:**
```typescript
interface CountdownTimerProps {
  targetDate: string; // UTC ISO string
  onComplete?: () => void;
  variant: 'overlay' | 'inline' | 'compact';
  timezone?: string; // Default: 'America/Vancouver'
}
```
**Features:**
- Real-time countdown with useInterval hook
- Automatic timezone conversion
- Format: "X days, Y hours, Z minutes, W seconds"
- Handles past dates gracefully
- Mobile-optimized sizing

---

#### 4. **EventStatusBanner**
**Used in:** All pages with eventId
**Location:** `/components/EventStatusBanner.tsx`
**Props:**
```typescript
interface EventStatusBannerProps {
  eventId: string;
  currentPage: 'registration' | 'voting' | 'results';
}
```
**Features:**
- Fetches event status from API
- Shows: "Registration Open" | "Voting Opens In X" | "Voting Open" | "Results Available"
- Auto-updates every 30 seconds
- Dismissible with localStorage persistence
- Sticky positioning for mobile

---

#### 5. **LoadingState**
**Used in:** All API calls, photo uploads, page transitions
**Location:** `/components/LoadingState.tsx`
**Props:**
```typescript
interface LoadingStateProps {
  variant: 'spinner' | 'skeleton' | 'progress';
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  progress?: number; // 0-100 for progress bar
}
```
**Variants:**
- `spinner`: Generic loading (default)
- `skeleton`: Card/list placeholders
- `progress`: File uploads with percentage

---

#### 6. **ErrorState**
**Used in:** All pages, API error boundaries
**Location:** `/components/ErrorState.tsx`
**Props:**
```typescript
interface ErrorStateProps {
  error: Error | ApiError | NetworkError;
  retry?: () => void;
  variant: 'page' | 'inline' | 'toast';
  recoverable?: boolean;
}
```
**Features:**
- User-friendly error messages (not raw error text)
- Retry button with debouncing
- Network error detection (offline banner)
- Error reporting integration hook

---

#### 7. **PhotoPreview**
**Used in:** Registration review, Admin moderation
**Location:** `/components/PhotoPreview.tsx`
**Props:**
```typescript
interface PhotoPreviewProps {
  src: string;
  alt: string;
  type: 'selfie' | 'full';
  onRetake?: () => void;
  loading?: boolean;
  error?: string;
}
```
**Features:**
- Optimized image display with blur placeholder
- Pinch-to-zoom on mobile
- Retake button (registration flow)
- Compression indicator (file size badge)

---

#### 8. **BottomSheet**
**Used in:** "My picks" summary, Confirmation dialogs
**Location:** `/components/BottomSheet.tsx`
**Props:**
```typescript
interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // [0.25, 0.5, 0.9] for drag stops
}
```
**Features:**
- Mobile-optimized slide-up panel
- Drag-to-close gesture
- Backdrop dismissal
- Smooth animations
- Desktop fallback (modal dialog)

---

### Medium Priority - Build During Feature Development

#### 9. **QRCodeDisplay**
**Used in:** Registration success, Admin tools
**Location:** `/components/QRCodeDisplay.tsx`
**Features:** Generate and display QR codes with labels

#### 10. **ProgressIndicator**
**Used in:** Registration flow (steps 1→2→3)
**Location:** `/components/ProgressIndicator.tsx`
**Features:** Multi-step progress visualization

#### 11. **EmptyState**
**Used in:** Results (no votes yet), Registration list (no attendees)
**Location:** `/components/EmptyState.tsx`
**Features:** Consistent empty state messaging

---

## 🔧 Shared Logic & Utilities

### Critical - Implement in Phase 1

#### 1. **Cookie Management**
**Location:** `/lib/cookies.ts`
**Functions:**
```typescript
// SERVER-SIDE ONLY (Route Handlers, Server Actions, Server Components)
import { cookies } from 'next/headers';

// Set attendee cookie with proper security flags
function setAttendeeCookie(eventId: string, attendeeId: string): void {
  cookies().set(`attendee_${eventId}`, attendeeId, {
    maxAge: 2592000, // 30 days
    sameSite: 'lax',
    secure: true,
    path: '/',
    httpOnly: false // Allow client-side read for React components
  });
}

// Get attendee ID from cookie for current event
function getAttendeeId(eventId: string): string | null {
  return cookies().get(`attendee_${eventId}`)?.value ?? null;
}

// Clear attendee cookie (for testing/logout)
function clearAttendeeCookie(eventId: string): void {
  cookies().delete(`attendee_${eventId}`);
}

// CLIENT-SIDE (React components - read only)
function getAttendeeCookieClient(eventId: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith(`attendee_${eventId}=`))
    ?.split('=')[1];
  return value ?? null;
}
```
**Used in:** All pages (registration, voting, results), All APIs
**Security:** `Secure; SameSite=Lax; HttpOnly=false; Path=/; Max-Age=2592000`

**Important:** Use Next.js `cookies()` function - NOT manual `Set-Cookie` headers!

---

#### 2. **API Client**
**Location:** `/lib/api-client.ts`
**Functions:**
```typescript
// Centralized fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { timeout?: number }
): Promise<T>

// Typed API calls for all endpoints
const api = {
  attendee: {
    upsert: (data: AttendeeUpsertRequest) => Promise<AttendeeUpsertResponse>
  },
  registration: {
    upsert: (data: FormData) => Promise<RegistrationUpsertResponse>,
    list: (eventId: string) => Promise<RegistrationListResponse>
  },
  vote: {
    set: (data: VoteSetRequest) => Promise<VoteSetResponse>
  },
  event: {
    status: (eventId: string) => Promise<EventStatusResponse>
  }
}

// Error handling with typed responses
class ApiError extends Error {
  statusCode: number;
  code: string;
  retryable: boolean;
}
```
**Features:**
- Automatic retry logic (3 attempts with exponential backoff)
- Request timeout (10s default)
- Network error detection
- Response validation
- TypeScript inference

---

#### 3. **Timezone Utilities**
**Location:** `/lib/timezone.ts`
**Functions:**
```typescript
// Convert UTC ISO string to America/Vancouver
function utcToLocal(utcDate: string): Date

// Check if current time is within voting window
function isVotingOpen(event: Event): boolean

// Format date for display ("Oct 31, 2024 8:00 PM PDT")
function formatEventTime(utcDate: string): string

// Calculate time remaining until target date
function getTimeRemaining(targetDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // milliseconds
}
```
**Dependencies:** `date-fns-tz` for timezone conversions
**Used in:** Voting validation, Countdown timer, Event status checks

---

#### 4. **Image Processing**
**Location:** `/lib/image-utils.ts`
**Functions:**
```typescript
// CLIENT-SIDE: Compress before upload
import imageCompression from 'browser-image-compression';

async function compressImage(file: File): Promise<Blob> {
  return await imageCompression(file, {
    maxWidthOrHeight: 1080,
    useWebWorker: true,
    quality: 0.7
  });
}

// Validate image file (MIME, size, dimensions)
async function validateImageFile(
  file: File,
  constraints: { maxSizeMB: number; maxDimensions: number }
): Promise<{ valid: boolean; error?: string }> {
  // Check MIME type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { valid: false, error: 'Please upload a JPG, PNG, or WEBP image.' };
  }
  
  // Check size
  if (file.size > constraints.maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Image is too large. Please use a photo under ${constraints.maxSizeMB}MB.` };
  }
  
  return { valid: true };
}

// SERVER-SIDE: Generate thumbnail with Sharp
import sharp from 'sharp';

async function generateThumbnail(
  buffer: Buffer,
  width: number = 400
): Promise<Buffer> {
  return await sharp(buffer)
    .resize(width, null, { 
      fit: 'inside',
      withoutEnlargement: true 
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

// Calculate file size reduction percentage
function getCompressionRatio(original: File, compressed: Blob): number {
  return Math.round((1 - compressed.size / original.size) * 100);
}
```
**Used in:** Registration photo upload, Admin tools
**Client:** `browser-image-compression` (install: `pnpm add browser-image-compression`)
**Server:** `sharp` (install: `pnpm add sharp`)

---

#### 5. **Validation Utilities**
**Location:** `/lib/validation.ts`
**Functions:**
```typescript
// Validate UUID format
function isValidUUID(id: string): boolean

// Validate display name (1-255 chars, no special rules)
function validateDisplayName(name: string): { valid: boolean; error?: string }

// Validate costume title (1-255 chars)
function validateCostumeTitle(title: string): { valid: boolean; error?: string }

// Validate category enum
function isValidCategory(category: string): category is Category

// Validate UTC ISO string format
function isValidUTCDate(date: string): boolean
```
**Used in:** All API endpoints, Form inputs, Database queries

---

#### 6. **Deterministic Shuffle**
**Location:** `/lib/shuffle.ts`
**Functions:**
```typescript
// Seeded shuffle for registration list
function deterministicShuffle<T>(
  array: T[],
  seed: string // hash(eventId + attendeeId)
): T[]

// Generate seed from eventId + attendeeId
function generateShuffleSeed(eventId: string, attendeeId: string): string

// Hash function (simple, deterministic)
function hashString(input: string): number
```
**Used in:** Registration list API (BR-004)
**Algorithm:** Fisher-Yates shuffle with seeded random

---

#### 7. **Error Messages**
**Location:** `/lib/error-messages.ts`
**Mapping:**
```typescript
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "Can't connect right now. Check your internet and try again.",
  VOTING_CLOSED: "Voting hasn't opened yet. Check back soon!",
  INVALID_FILE_TYPE: "Please upload a JPG, PNG, or WEBP image.",
  FILE_TOO_LARGE: "Image is too large. Please use a photo under 6MB.",
  CAMERA_DENIED: "Camera access denied. You can upload a photo instead.",
  RATE_LIMITED: "Slow down! Too many requests. Wait a moment and try again.",
  // ... etc
}

function getUserFriendlyMessage(error: Error | ApiError): string
```
**Used in:** All error states, Toast notifications

---

#### 8. **Optimistic UI Helpers**
**Location:** `/lib/optimistic.ts`
**Functions:**
```typescript
// Update UI immediately, rollback on failure
function withOptimisticUpdate<T>(
  optimisticUpdate: () => void,
  apiCall: () => Promise<T>,
  rollback: () => void
): Promise<T>

// Queue for offline actions (votes, registrations)
class OfflineQueue {
  add(action: Action): void
  process(): Promise<void>
  getStatus(): { pending: number; failed: number }
}
```
**Used in:** Voting flow (PERF-003), Registration submission

---

## 🎯 One-Off Components & Logic

### Registration-Specific

#### **CameraCapture**
**Location:** `/components/registration/CameraCapture.tsx`
**Features:**
- Front/back camera toggle
- Permission handling with fallback
- Live preview
- Capture button
- NOT reusable (specific to registration flow)

#### **RegistrationStepper**
**Location:** `/app/r/[eventId]/components/RegistrationStepper.tsx`
**Steps:** Name → Selfie → Full Photo → Review → Success
**Features:** Step validation, local draft storage

---

### Voting-Specific

#### **SwipeableCard**
**Location:** `/app/v/[eventId]/components/SwipeableCard.tsx`
**Features:**
- Touch gesture detection (left/right swipe)
- Spring animations (react-spring or framer-motion)
- Velocity-based dismiss threshold
- NOT reusable (tinder-style is voting-specific)

#### **VotingDeck**
**Location:** `/app/v/[eventId]/components/VotingDeck.tsx`
**Features:**
- Card stack management
- Category filtering
- Pre-loading next cards
- Vote persistence

---

### Results-Specific

#### **WinnerDisplay**
**Location:** `/app/results/[eventId]/components/WinnerDisplay.tsx`
**Features:**
- Trophy/ribbon visuals
- Vote count display
- Tie indicator
- NOT reusable (results-specific layout)

#### **VoteCountingLogic**
**Location:** `/lib/results.ts`
**Functions:**
```typescript
function calculateWinners(votes: Vote[], registrations: Registration[]): Winners
function applyTieBreaker(tied: Registration[]): Registration
```
**Used in:** Results API endpoint only

---

### Admin-Specific

#### **ModerationPanel**
**Location:** `/app/admin/[eventId]/components/ModerationPanel.tsx`
**Features:**
- Approve/reject buttons
- Bulk actions
- Hide/unhide toggle
- NOT reusable (admin-only)

---

## 📦 Recommended File Structure

```
/lib/
  ├── api-client.ts          # ✅ Shared API utilities
  ├── cookies.ts             # ✅ Cookie management
  ├── timezone.ts            # ✅ Timezone conversions
  ├── image-utils.ts         # ✅ Image processing
  ├── validation.ts          # ✅ Input validation
  ├── shuffle.ts             # ✅ Deterministic shuffle
  ├── error-messages.ts      # ✅ User-friendly errors
  ├── optimistic.ts          # ✅ Optimistic UI helpers
  └── results.ts             # 🔶 Results-specific logic

/components/
  ├── CostumeCard.tsx        # ✅ HIGH PRIORITY - Used everywhere
  ├── CategoryBadge.tsx      # ✅ HIGH PRIORITY - Used everywhere
  ├── CountdownTimer.tsx     # ✅ HIGH PRIORITY - Voting + Registration
  ├── EventStatusBanner.tsx  # ✅ Used on all pages
  ├── LoadingState.tsx       # ✅ Used everywhere
  ├── ErrorState.tsx         # ✅ Used everywhere
  ├── PhotoPreview.tsx       # ✅ Registration + Admin
  ├── BottomSheet.tsx        # ✅ Voting + Modals
  ├── QRCodeDisplay.tsx      # ⚠️ Medium priority
  ├── ProgressIndicator.tsx  # ⚠️ Medium priority
  └── EmptyState.tsx         # ⚠️ Medium priority

/app/r/[eventId]/components/
  ├── CameraCapture.tsx      # 🔶 Registration-specific
  └── RegistrationStepper.tsx # 🔶 Registration-specific

/app/v/[eventId]/components/
  ├── SwipeableCard.tsx      # 🔶 Voting-specific
  └── VotingDeck.tsx         # 🔶 Voting-specific

/app/results/[eventId]/components/
  └── WinnerDisplay.tsx      # 🔶 Results-specific

/app/admin/[eventId]/components/
  └── ModerationPanel.tsx    # 🔶 Admin-specific
```

---

## 🎨 Design Tokens (Shared)

**Location:** `/styles/tokens.css` or `/lib/design-tokens.ts`

```typescript
export const COLORS = {
  category: {
    funniest: '#FCD34D',    // yellow
    scariest: '#A78BFA',    // purple
    cutest: '#F9A8D4',      // pink
    personalFavorite: '#FB923C' // orange
  },
  status: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  }
}

export const SPACING = {
  cardGap: '1rem',
  sectionPadding: '1.5rem',
  mobilePadding: '1rem'
}

export const TIMING = {
  swipeAnimation: 200,      // ms
  toastDuration: 3000,      // ms
  apiTimeout: 10000,        // ms
  countdownInterval: 1000   // ms
}
```

---

## 🔄 Data Flow Patterns

### Pattern 1: Cookie-Based Identity (ALL PAGES)
```typescript
// Server Components
const attendeeId = getAttendeeId(eventId); // from cookies
if (!attendeeId) redirect('/r/' + eventId);

// Client Components
useEffect(() => {
  const attendeeId = getAttendeeId(eventId);
  if (!attendeeId) router.push('/r/' + eventId);
}, [eventId]);
```

### Pattern 2: Optimistic Voting (VOTING PAGE)
```typescript
// Update UI immediately
setMyVotes({ ...myVotes, [category]: registrationId });

// Save to server
api.vote.set({ eventId, voterAttendeeId, category, targetRegistrationId })
  .catch(() => {
    // Rollback on failure
    setMyVotes(previousVotes);
    toast.error("Vote failed. Try again!");
  });
```

### Pattern 3: Event Status Polling (VOTING PAGE)
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await api.event.status(eventId);
    setVotingOpen(status.votingOpen);
  }, 30000); // Poll every 30s

  return () => clearInterval(interval);
}, [eventId]);
```

---

## ✅ Implementation Priority

### Phase 1: Foundation (Week 1)
1. ✅ Cookie utilities (`/lib/cookies.ts`)
2. ✅ API client (`/lib/api-client.ts`)
3. ✅ Validation utilities (`/lib/validation.ts`)
4. ✅ Error messages (`/lib/error-messages.ts`)
5. ✅ LoadingState + ErrorState components

### Phase 2: Registration (Week 1-2)
6. ✅ Image processing (`/lib/image-utils.ts`)
7. ✅ PhotoPreview component
8. ✅ CameraCapture (one-off)
9. ✅ QRCodeDisplay component

### Phase 3: Voting (Week 2-3)
10. ✅ Timezone utilities (`/lib/timezone.ts`)
11. ✅ Shuffle algorithm (`/lib/shuffle.ts`)
12. ✅ Optimistic UI helpers (`/lib/optimistic.ts`)
13. ✅ CostumeCard component (HIGH PRIORITY)
14. ✅ CategoryBadge component (HIGH PRIORITY)
15. ✅ CountdownTimer component (HIGH PRIORITY)
16. ✅ BottomSheet component
17. ✅ SwipeableCard (one-off)
18. ✅ VotingDeck (one-off)

### Phase 4: Results & Admin (Week 3-4)
19. ✅ Results logic (`/lib/results.ts`)
20. ✅ WinnerDisplay (one-off)
21. ✅ ModerationPanel (one-off)

---

## 📝 Documentation Requirements

### For Each Shared Component
- [ ] TypeScript interface with JSDoc comments
- [ ] Usage examples in component file header
- [ ] Accessibility notes (ARIA, keyboard nav)
- [ ] Mobile considerations
- [ ] Error handling behavior

### For Each Shared Utility
- [ ] Function signature with JSDoc
- [ ] Input validation rules
- [ ] Error cases and handling
- [ ] Usage examples
- [ ] Performance considerations

### Example:
```typescript
/**
 * CostumeCard - Reusable card component for displaying costume registrations
 * 
 * @example
 * ```tsx
 * <CostumeCard
 *   registration={registration}
 *   variant="swipeable"
 *   onSwipe={(direction) => handleSwipe(direction)}
 * />
 * ```
 * 
 * @accessibility
 * - Uses semantic HTML (`<article>`)
 * - Includes ARIA labels for images
 * - Keyboard navigable with tab/enter
 * 
 * @mobile
 * - Touch gestures enabled for swipeable variant
 * - Responsive images with Next.js Image
 * - Optimized for 320px+ screen widths
 */
export function CostumeCard({ registration, variant, ...props }: CostumeCardProps) {
  // ...
}
```

---

## 🚨 Anti-Patterns to Avoid

1. ❌ **Duplicating Cookie Logic**: Always use `/lib/cookies.ts`
2. ❌ **Inline API Calls**: Always use `/lib/api-client.ts`
3. ❌ **Hardcoded Category Labels**: Use `CATEGORY_CONFIG` constant
4. ❌ **Manual Timezone Math**: Use `/lib/timezone.ts` utilities
5. ❌ **Copy-Pasting Error Messages**: Use `/lib/error-messages.ts`
6. ❌ **Custom Card Components**: Extend `CostumeCard` with variants
7. ❌ **Inline Loading Spinners**: Use `LoadingState` component

---

## 📊 Component Dependency Graph

```
CostumeCard (shared)
  ├── Used by: VotingDeck
  ├── Used by: WinnerDisplay
  ├── Used by: ModerationPanel
  └── Used by: RegistrationStepper (review step)

CategoryBadge (shared)
  ├── Used by: VotingDeck (category filter)
  ├── Used by: BottomSheet (my picks)
  └── Used by: WinnerDisplay (results)

CountdownTimer (shared)
  ├── Used by: VotingDeck (pre-open overlay)
  └── Used by: EventStatusBanner

BottomSheet (shared)
  ├── Used by: VotingDeck (my picks)
  └── Used by: RegistrationStepper (confirmation)

LoadingState (shared)
  ├── Used by: ALL pages
  └── Used by: ALL API calls

ErrorState (shared)
  ├── Used by: ALL pages
  └── Used by: ALL API calls
```

---

## 🎯 Testing Strategy for Shared Components

### Unit Tests
- [ ] Cookie utilities: set/get/clear/validate
- [ ] Timezone conversions: UTC ↔ America/Vancouver
- [ ] Image compression: file size reduction
- [ ] Validation: displayName, costumeTitle, UUID, category
- [ ] Deterministic shuffle: same seed = same order

### Component Tests (Vitest + Testing Library)
- [ ] CostumeCard: renders correctly in all variants
- [ ] CategoryBadge: selection state toggles
- [ ] CountdownTimer: updates every second
- [ ] LoadingState: shows spinner/skeleton/progress
- [ ] ErrorState: displays error + retry button

### Integration Tests
- [ ] Cookie persistence across page loads
- [ ] API client retry logic (3 attempts)
- [ ] Optimistic UI rollback on failure
- [ ] Event status polling (30s interval)

---

## 📈 Performance Considerations

### Shared Components
- ✅ `CostumeCard`: Lazy load images with Next.js Image
- ✅ `CategoryBadge`: Memoize with React.memo
- ✅ `CountdownTimer`: Cleanup interval on unmount
- ✅ `LoadingState`: Skeleton screens prevent layout shift

### Shared Utilities
- ✅ `api-client.ts`: Request deduplication
- ✅ `image-utils.ts`: Web Worker for compression
- ✅ `shuffle.ts`: Memoize shuffle results per attendee

---

---

## 📝 Implementation Examples (Ready to Use)

### Example 1: Registration Upload Route Handler

**File:** `/app/api/registration/upsert/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse multipart form data
    const formData = await request.formData();
    const eventId = formData.get('eventId') as string;
    const attendeeId = formData.get('attendeeId') as string;
    const costumeTitle = formData.get('costumeTitle') as string;
    const photoSelfie = formData.get('photoSelfie') as File;
    const photoFull = formData.get('photoFull') as File;

    // 2. Validate inputs
    if (!eventId || !attendeeId || !costumeTitle) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3. Validate cookie matches
    const cookieAttendeeId = cookies().get(`attendee_${eventId}`)?.value;
    if (cookieAttendeeId !== attendeeId) {
      return NextResponse.json(
        { success: false, error: 'Invalid attendee' },
        { status: 401 }
      );
    }

    // 4. Validate files
    if (!photoSelfie || !photoFull) {
      return NextResponse.json(
        { success: false, error: 'Both photos required' },
        { status: 400 }
      );
    }

    if (photoSelfie.size > 6 * 1024 * 1024 || photoFull.size > 6 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Images must be under 6MB' },
        { status: 413 }
      );
    }

    // 5. Process images
    const selfieBuffer = Buffer.from(await photoSelfie.arrayBuffer());
    const fullBuffer = Buffer.from(await photoFull.arrayBuffer());

    // Generate thumbnails
    const selfieThumbnail = await sharp(selfieBuffer)
      .resize(400, null, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const fullThumbnail = await sharp(fullBuffer)
      .resize(400, null, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 6. Save files (example: local filesystem)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', eventId);
    await mkdir(uploadDir, { recursive: true });

    const registrationId = crypto.randomUUID();
    const selfieFilename = `${registrationId}_selfie.jpg`;
    const selfieThumbFilename = `${registrationId}_selfie_thumb.jpg`;
    const fullFilename = `${registrationId}_full.jpg`;
    const fullThumbFilename = `${registrationId}_full_thumb.jpg`;

    await Promise.all([
      writeFile(path.join(uploadDir, selfieFilename), selfieBuffer),
      writeFile(path.join(uploadDir, selfieThumbFilename), selfieThumbnail),
      writeFile(path.join(uploadDir, fullFilename), fullBuffer),
      writeFile(path.join(uploadDir, fullThumbFilename), fullThumbnail),
    ]);

    // 7. Save to database (TODO: add Prisma/DB call)
    // await db.registration.create({ ... });

    // 8. Return success
    return NextResponse.json({
      success: true,
      registrationId,
      photoSelfieUrl: `/uploads/${eventId}/${selfieFilename}`,
      photoFullUrl: `/uploads/${eventId}/${fullFilename}`,
    });

  } catch (error) {
    console.error('Registration upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

---

### Example 2: Camera Capture Component (Simple HTML Approach)

**File:** `/components/registration/PhotoCapture.tsx`

```typescript
'use client';

import { useState, useRef } from 'react';
import { compressImage, validateImageFile } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/LoadingState';

interface PhotoCaptureProps {
  type: 'selfie' | 'full';
  onCapture: (file: File) => void;
}

export function PhotoCapture({ type, onCapture }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Validate
      const validation = await validateImageFile(file, { 
        maxSizeMB: 6, 
        maxDimensions: 4096 
      });
      
      if (!validation.valid) {
        setError(validation.error!);
        setLoading(false);
        return;
      }

      // 2. Compress
      const compressed = await compressImage(file);
      const compressedFile = new File([compressed], file.name, { 
        type: 'image/jpeg' 
      });

      // 3. Preview
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);

      // 4. Callback
      onCapture(compressedFile);

    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture={type === 'selfie' ? 'user' : 'environment'}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img 
            src={preview} 
            alt={`${type} preview`} 
            className="w-full rounded-lg"
          />
          <Button
            onClick={() => inputRef.current?.click()}
            variant="outline"
            className="mt-2"
          >
            Retake
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <LoadingState variant="spinner" size="sm" />
          ) : (
            `Capture ${type === 'selfie' ? 'Selfie' : 'Costume Photo'}`
          )}
        </Button>
      )}

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
```

---

### Example 3: Timezone Utilities

**File:** `/lib/timezone.ts`

```typescript
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { differenceInMilliseconds } from 'date-fns';

const VANCOUVER_TZ = 'America/Vancouver';

// Convert UTC ISO string to America/Vancouver Date
export function utcToLocal(utcDate: string): Date {
  return toDate(utcDate, { timeZone: VANCOUVER_TZ });
}

// Check if current time is within voting window
export function isVotingOpen(event: { 
  votingOpensAt: string; 
  votingClosesAt?: string;
}): boolean {
  const now = new Date();
  const opensAt = new Date(event.votingOpensAt);
  
  if (now < opensAt) return false;
  
  if (event.votingClosesAt) {
    const closesAt = new Date(event.votingClosesAt);
    if (now > closesAt) return false;
  }
  
  return true;
}

// Format date for display ("Oct 31, 2024 8:00 PM PDT")
export function formatEventTime(utcDate: string): string {
  return formatInTimeZone(
    utcDate, 
    VANCOUVER_TZ, 
    'MMM d, yyyy h:mm a zzz'
  );
}

// Calculate time remaining until target date
export function getTimeRemaining(targetDate: string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const now = new Date();
  const target = new Date(targetDate);
  const total = differenceInMilliseconds(target, now);

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}
```

**Install:** `pnpm add date-fns date-fns-tz`

---

### Example 4: Native HTML Camera with Fallback

**File:** `/app/r/[eventId]/page.tsx` (simplified registration page)

```typescript
'use client';

import { useState } from 'react';
import { PhotoCapture } from '@/components/registration/PhotoCapture';
import { Button } from '@/components/ui/button';

export default function RegistrationPage({ params }: { params: { eventId: string } }) {
  const [selfie, setSelfie] = useState<File | null>(null);
  const [fullPhoto, setFullPhoto] = useState<File | null>(null);
  const [costumeTitle, setCostumeTitle] = useState('');

  const handleSubmit = async () => {
    if (!selfie || !fullPhoto || !costumeTitle) return;

    const formData = new FormData();
    formData.append('eventId', params.eventId);
    formData.append('attendeeId', 'TODO'); // Get from cookie
    formData.append('costumeTitle', costumeTitle);
    formData.append('photoSelfie', selfie);
    formData.append('photoFull', fullPhoto);

    const response = await fetch('/api/registration/upsert', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      // Navigate to success page
    }
  };

  return (
    <div className="container max-w-md mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Register Your Costume</h1>

      <div>
        <label className="block mb-2">Costume Title</label>
        <input
          type="text"
          value={costumeTitle}
          onChange={(e) => setCostumeTitle(e.target.value)}
          className="w-full border rounded px-3 py-2"
          maxLength={255}
        />
      </div>

      <div>
        <label className="block mb-2">Selfie (Front Camera)</label>
        <PhotoCapture type="selfie" onCapture={setSelfie} />
      </div>

      <div>
        <label className="block mb-2">Costume Photo (Back Camera)</label>
        <PhotoCapture type="full" onCapture={setFullPhoto} />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!selfie || !fullPhoto || !costumeTitle}
        className="w-full"
      >
        Submit Registration
      </Button>
    </div>
  );
}
```

---

## 📦 Required Dependencies

Add to `package.json`:

```bash
pnpm add sharp browser-image-compression date-fns date-fns-tz
pnpm add -D @types/sharp
```

---

**Next Steps:**
1. Start with **Phase 1** shared utilities (cookies, API client, validation)
2. Build **LoadingState** and **ErrorState** components first
3. Implement **CostumeCard** and **CategoryBadge** during registration phase
4. Add comprehensive JSDoc comments to all shared code
5. Use the implementation examples above as templates for your route handlers and components

