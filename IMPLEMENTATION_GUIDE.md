# Implementation Quick Reference Guide

This document provides the exact libraries, patterns, and implementation details needed to build each feature according to the spec.

---

## 🎯 Critical Implementation Decisions (From Research)

### Cookies (All Pages)
- **✅ DECISION:** Use Next.js 15 `cookies()` function in Route Handlers
- **Pattern:** `cookies().set('attendee_[eventId]', attendeeId, { maxAge: 2592000, sameSite: 'lax', secure: true, path: '/' })`
- **Server:** Use `cookies()` from `next/headers`
- **Client:** Read with `document.cookie` (read-only)
- **Refs:** [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)

### File Uploads (Registration)
- **✅ DECISION:** Use Route Handlers with native `request.formData()`
- **Pattern:** Direct File object reading, no external parser needed
- **Server:** `const formData = await request.formData(); const file = formData.get('photo') as File;`
- **Alternative:** `formidable` if needed for streaming large files
- **Refs:** [GitHub Discussion](https://github.com/vercel/next.js/discussions/50165)

### Camera Capture (Registration)
- **✅ DECISION:** Use native HTML `<input type="file" capture>` with fallback
- **Pattern:** `<input type="file" accept="image/*" capture="user">` (front) or `capture="environment"` (back)
- **Fallback:** Always works as standard file input if capture unsupported
- **Alternative:** `react-webcam` if need live preview (adds complexity)
- **Refs:** [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture)

### Client-Side Image Compression (Registration)
- **✅ DECISION:** `browser-image-compression` library
- **Config:** `{ maxWidthOrHeight: 1080, useWebWorker: true, quality: 0.7 }`
- **Install:** `pnpm add browser-image-compression`
- **Target:** >50% file size reduction before upload
- **Refs:** [npm package](https://www.npmjs.com/package/browser-image-compression)

### Server-Side Thumbnails (Registration API)
- **✅ DECISION:** `sharp` library (Node ≥18.17)
- **Config:** `sharp(buffer).resize(400, null, { fit: 'inside' }).jpeg({ quality: 80 })`
- **Install:** `pnpm add sharp`
- **Output:** 200-400px thumbnails for gallery/results
- **Refs:** [sharp docs](https://sharp.pixelplumbing.com/)

### Timezone Handling (Voting, Results)
- **✅ DECISION:** `date-fns-tz` for conversions
- **Pattern:** Store UTC in DB, validate in UTC, display in America/Vancouver
- **Install:** `pnpm add date-fns date-fns-tz`
- **Functions:** `formatInTimeZone()`, `toDate()`, `differenceInMilliseconds()`
- **Refs:** [npm package](https://www.npmjs.com/package/date-fns-tz)

---

## 📦 Dependencies (Install First)

```bash
# Core dependencies
pnpm add sharp browser-image-compression date-fns date-fns-tz

# Dev dependencies
pnpm add -D @types/sharp
```

---

## 🗂️ Implementation Checklist by Feature

### Phase 1: Foundation (Week 1)

#### 1.1 Cookie Utilities (`/lib/cookies.ts`)
- [ ] Implement `setAttendeeCookie()` using `cookies().set()`
- [ ] Implement `getAttendeeId()` using `cookies().get()`
- [ ] Implement `clearAttendeeCookie()` using `cookies().delete()`
- [ ] Implement client-side `getAttendeeCookieClient()` for React components
- [ ] Test cookie persistence across page reloads
- **Example code:** See ARCHITECTURE.md Example 1

#### 1.2 Image Processing (`/lib/image-utils.ts`)
- [ ] Implement `compressImage()` using `browser-image-compression`
- [ ] Implement `validateImageFile()` with MIME + size checks
- [ ] Implement `generateThumbnail()` using `sharp`
- [ ] Implement `getCompressionRatio()` helper
- [ ] Test >50% compression rate
- **Example code:** See ARCHITECTURE.md section 4

#### 1.3 Timezone Utilities (`/lib/timezone.ts`)
- [ ] Implement `utcToLocal()` using `date-fns-tz`
- [ ] Implement `isVotingOpen()` for window validation
- [ ] Implement `formatEventTime()` for display
- [ ] Implement `getTimeRemaining()` for countdown
- [ ] Test timezone conversions
- **Example code:** See ARCHITECTURE.md Example 3

#### 1.4 Validation Utilities (`/lib/validation.ts`)
- [ ] Implement `isValidUUID()`
- [ ] Implement `validateDisplayName()` (1-255 chars)
- [ ] Implement `validateCostumeTitle()` (1-255 chars)
- [ ] Implement `isValidCategory()` type guard
- [ ] Implement `isValidUTCDate()`

#### 1.5 Base UI Components
- [ ] Create `LoadingState` component (spinner, skeleton, progress variants)
- [ ] Create `ErrorState` component with retry logic
- [ ] Create `Button` component (already exists in /components/ui/)
- [ ] Test responsive behavior

---

### Phase 2: Registration Flow (Week 1-2)

#### 2.1 Registration API (`/app/api/attendee/upsert/route.ts`)
- [ ] Accept `{ eventId, displayName }`
- [ ] Validate inputs
- [ ] Create/update attendee in database
- [ ] Set cookie using `cookies().set()`
- [ ] Return `{ attendeeId, success }`
- **Spec:** API-001

#### 2.2 Registration Upload API (`/app/api/registration/upsert/route.ts`)
- [ ] Use `request.formData()` to parse multipart data
- [ ] Validate cookie matches attendeeId
- [ ] Validate files (MIME, size <6MB)
- [ ] Compress images with `sharp`
- [ ] Generate thumbnails (400px width)
- [ ] Save to storage (filesystem or S3/R2)
- [ ] Save URLs to database
- [ ] Return `{ registrationId, photoSelfieUrl, photoFullUrl, success }`
- **Example code:** See ARCHITECTURE.md Example 1
- **Spec:** API-002

#### 2.3 Photo Capture Component (`/components/registration/PhotoCapture.tsx`)
- [ ] Use `<input type="file" capture>` for native camera
- [ ] Add front (`user`) and back (`environment`) camera support
- [ ] Validate file on selection
- [ ] Compress with `compressImage()`
- [ ] Show preview with URL.createObjectURL
- [ ] Add "Retake" button
- [ ] Handle errors gracefully
- **Example code:** See ARCHITECTURE.md Example 2
- **Spec:** REQ-001, ERR-002

#### 2.4 Registration Page (`/app/r/[eventId]/page.tsx`)
- [ ] Multi-step flow: Name → Selfie → Full Photo → Review → Success
- [ ] Use `PhotoCapture` component for both photos
- [ ] Input validation (1-255 chars for name/title)
- [ ] Submit FormData to `/api/registration/upsert`
- [ ] Show progress indicators
- [ ] Success state with voting QR link
- **Example code:** See ARCHITECTURE.md Example 4
- **Spec:** REQ-001

---

### Phase 3: Voting Flow (Week 2-3)

#### 3.1 Event Status API (`/app/api/events/[eventId]/status/route.ts`)
- [ ] Calculate `votingOpen` using `isVotingOpen()`
- [ ] Return UTC timestamps: `opensAtUTC`, `closesAtUTC`, `nowUTC`
- [ ] Handle missing event (404)
- **Spec:** API-005

#### 3.2 Registration List API (`/app/api/registration/list/route.ts`)
- [ ] Query approved registrations only (`isApproved = true`)
- [ ] Implement deterministic shuffle using `hash(eventId + attendeeId)`
- [ ] Validate attendee cookie exists (401 if missing)
- [ ] Return array of registrations
- **Spec:** API-004, BR-004

#### 3.3 Vote API (`/app/api/vote/set/route.ts`)
- [ ] Validate voting window is open
- [ ] Validate category enum
- [ ] Validate target registration exists
- [ ] Upsert vote by `(eventId, voterAttendeeId, category)`
- [ ] Return success or error (409 if closed)
- **Spec:** API-003, BR-001, BR-002

#### 3.4 Shared Components (HIGH PRIORITY)
- [ ] Create `CostumeCard` with variants (swipeable, static, compact)
- [ ] Create `CategoryBadge` with category config
- [ ] Create `CountdownTimer` with timezone support
- [ ] Create `BottomSheet` for mobile (or use shadcn/ui Sheet)
- **Spec:** See ARCHITECTURE.md section 1-8

#### 3.5 Voting Page (`/app/v/[eventId]/page.tsx`)
- [ ] Poll event status every 30s
- [ ] Show countdown if voting not open
- [ ] Implement tinder-style card swipe
- [ ] Category selection pills
- [ ] "My picks" bottom sheet
- [ ] Optimistic UI for votes
- [ ] Persist votes across refreshes
- **Spec:** REQ-002

---

### Phase 4: Results & Admin (Week 3-4)

#### 4.1 Results Logic (`/lib/results.ts`)
- [ ] Implement vote counting per category
- [ ] Apply tie-breaking: earliest `createdAt`, then lowest `id`
- [ ] Return winners with vote counts
- **Spec:** REQ-003, BR-005

#### 4.2 Results Page (`/app/results/[eventId]/page.tsx`)
- [ ] Display winner per category with photo
- [ ] Show vote counts
- [ ] Use `CostumeCard` static variant
- [ ] Use `CategoryBadge` result variant
- **Spec:** REQ-003

#### 4.3 Admin Moderation (Optional)
- [ ] Implement `/api/registration/moderate` endpoint
- [ ] Simple password-protected admin page
- [ ] Approve/reject/hide functionality
- **Spec:** Phase 4, Task 11

---

## 🔐 Security Checklist

### Cookie Security (SEC-001)
- [ ] All cookies use `secure: true`
- [ ] All cookies use `sameSite: 'lax'`
- [ ] Cookies scoped to event: `attendee_${eventId}`
- [ ] 30-day expiry (`maxAge: 2592000`)

### File Upload Security (SEC-002)
- [ ] Server validates MIME types (image/jpeg, image/png, image/webp)
- [ ] Server validates file size (<6MB, return 413 if exceeded)
- [ ] Server validates dimensions (<4096px)
- [ ] Reject non-image files with clear error

### Rate Limiting (SEC-003)
- [ ] Implement 10 votes/minute per `(IP, attendeeId)`
- [ ] Return 429 on rate limit exceeded

### Cross-Event Protection (SEC-004)
- [ ] Validate `targetRegistrationId` belongs to `eventId`
- [ ] Return 400 on cross-event vote attempt

---

## ⚡ Performance Checklist

### Page Load Times (PERF-001)
- [ ] Use Next.js Image component for optimization
- [ ] Implement lazy loading for images
- [ ] Use thumbnails (400px) for list/gallery views
- [ ] Target Lighthouse score >90

### Photo Upload Speed (PERF-002)
- [ ] Client-side compression reduces size >50%
- [ ] Show progress indicator during upload
- [ ] Target <10s upload time

### Voting Responsiveness (PERF-003)
- [ ] Optimistic UI updates (<100ms perceived latency)
- [ ] Background API call with retry
- [ ] Target <500ms actual response time

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Cookie utilities (set/get/clear)
- [ ] Timezone conversions (UTC ↔ America/Vancouver)
- [ ] Image compression (verify >50% reduction)
- [ ] Validation functions (UUID, displayName, category)
- [ ] Deterministic shuffle (same seed = same order)

### Integration Tests
- [ ] Cookie persistence across page loads
- [ ] API client retry logic (3 attempts)
- [ ] File upload end-to-end
- [ ] Voting flow with optimistic UI

### Manual Testing (Mobile)
- [ ] Camera capture on iOS Safari
- [ ] Camera capture on Android Chrome
- [ ] Cookie persistence across sessions
- [ ] Touch gestures for swipe
- [ ] Offline behavior

---

## 📚 Reference Links

### Next.js App Router
- [Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)

### Image Processing
- [browser-image-compression (npm)](https://www.npmjs.com/package/browser-image-compression)
- [sharp (docs)](https://sharp.pixelplumbing.com/)

### Timezone
- [date-fns-tz (npm)](https://www.npmjs.com/package/date-fns-tz)

### Camera Capture
- [HTML capture attribute (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture)
- [react-webcam (alternative)](https://www.npmjs.com/package/react-webcam)

### File Uploads
- [Next.js multipart discussion](https://github.com/vercel/next.js/discussions/50165)
- [formidable (alternative parser)](https://www.npmjs.com/package/formidable)

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
pnpm add sharp browser-image-compression date-fns date-fns-tz
pnpm add -D @types/sharp

# Create directories
mkdir -p lib components/registration app/api/attendee/upsert app/api/registration/upsert app/api/vote/set

# Copy implementation examples from ARCHITECTURE.md

# Start development
pnpm dev
```

---

## 📋 Daily Development Workflow

### Day 1-2: Foundation
1. Implement `/lib/cookies.ts` (Example in ARCHITECTURE.md)
2. Implement `/lib/image-utils.ts` (Example in ARCHITECTURE.md)
3. Implement `/lib/timezone.ts` (Example in ARCHITECTURE.md)
4. Test all utilities with simple scripts

### Day 3-4: Registration Backend
1. Implement `/app/api/attendee/upsert/route.ts`
2. Implement `/app/api/registration/upsert/route.ts` (Example in ARCHITECTURE.md)
3. Test with Postman/curl

### Day 5-6: Registration Frontend
1. Implement `/components/registration/PhotoCapture.tsx` (Example in ARCHITECTURE.md)
2. Implement `/app/r/[eventId]/page.tsx` (Example in ARCHITECTURE.md)
3. Test on mobile devices

### Day 7-9: Voting Backend
1. Implement `/app/api/events/[eventId]/status/route.ts`
2. Implement `/app/api/registration/list/route.ts`
3. Implement `/app/api/vote/set/route.ts`

### Day 10-12: Voting Frontend
1. Build shared components (CostumeCard, CategoryBadge, CountdownTimer)
2. Implement `/app/v/[eventId]/page.tsx`
3. Test voting flow

### Day 13-14: Results & Polish
1. Implement results calculation
2. Build results page
3. Mobile testing and bug fixes

---

**Remember:** Use the implementation examples in ARCHITECTURE.md as copy-paste templates!

