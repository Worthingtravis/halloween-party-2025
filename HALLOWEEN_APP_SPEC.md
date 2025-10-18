# Halloween Costume Contest App - Spec-Driven Development Specification

## System Overview
**Purpose**: Mobile-first Halloween costume contest with QR-based registration and voting flows
**Architecture**: Next.js 15 App Router, PostgreSQL, cookie-only identity, tinder-style voting
**Target**: Halloween party attendees with mobile devices

## Core Requirements

### REQ-001: Registration Flow
**As a** party attendee  
**I want to** register my costume with photos  
**So that** I can participate in the contest  

**Acceptance Criteria:**
- [ ] Can access registration via QR code at `/r/[eventId]`
- [ ] Can enter name and costume title
- [ ] Can capture selfie (front camera) and full-body photo (back camera)
- [ ] Can review and submit registration
- [ ] Receives confirmation "You're in!" with voting QR link
- [ ] Registration completes in <60 seconds
- [ ] Cookie persists for 30 days, scoped to event

**Test Cases:**
- [ ] New user completes full registration flow
- [ ] Returning user (with cookie) skips to photos
- [ ] Camera permissions denied → file upload fallback works
- [ ] Network interruption → local draft preserved
- [ ] Photo compression reduces file size by >50%

### REQ-002: Voting Flow
**As a** registered attendee  
**I want to** vote on costumes in 4 categories  
**So that** I can participate in selecting winners  

**Acceptance Criteria:**
- [ ] Can access voting via QR code at `/v/[eventId]`
- [ ] Voting locked until `event.votingOpensAt` (America/Vancouver timezone)
- [ ] Can swipe through costume cards (tinder-style)
- [ ] Can select one costume per category (Funniest, Scariest, Cutest, Personal Favorite)
- [ ] Can change selections (replaces previous choice)
- [ ] Votes save immediately (optimistic UI)
- [ ] Can view "My picks" summary
- [ ] Voting completes in <5 minutes

**Test Cases:**
- [ ] Voting disabled before opening time
- [ ] Countdown timer shows correct time remaining
- [ ] Each category allows exactly one selection
- [ ] Changing selection replaces previous choice
- [ ] Votes persist across page refreshes
- [ ] Network interruption → optimistic UI with retry

### REQ-003: Results Display
**As a** party attendee  
**I want to** see contest winners  
**So that** I can celebrate the results  

**Acceptance Criteria:**
- [ ] Results available at `/results/[eventId]`
- [ ] Shows winner for each category with photo
- [ ] Displays vote counts
- [ ] Tie-breaking rule is transparent
- [ ] Results are deterministic and auditable

**Test Cases:**
- [ ] Results match vote counts exactly
- [ ] Tie-breaking works consistently
- [ ] Results page loads in <2 seconds

## API Contracts

### API-001: Attendee Management
**Endpoint**: `POST /api/attendee/upsert`

**Request Contract:**
```typescript
interface AttendeeUpsertRequest {
  eventId: string; // UUID
  displayName: string; // 1-255 chars, required
}
```

**Response Contract:**
```typescript
interface AttendeeUpsertResponse {
  attendeeId: string; // UUID
  success: boolean;
}
```

**Behavior:**
- Creates or updates attendee record
- Sets cookie: `attendee_[eventId]={attendeeId}; Max-Age=2592000; SameSite=Lax; Secure; Path=/`
- Returns 200 on success, 400 on validation error

**Test Cases:**
- [ ] New attendee created with valid data
- [ ] Existing attendee updated with new name
- [ ] Cookie set with correct attributes
- [ ] Validation fails for empty displayName
- [ ] Validation fails for invalid eventId

### API-002: Registration Submission
**Endpoint**: `POST /api/registration/upsert`

**Request Contract:**
```typescript
interface RegistrationUpsertRequest {
  eventId: string; // UUID
  attendeeId: string; // UUID
  costumeTitle: string; // 1-255 chars, required
  photoSelfie: File; // image/jpeg, image/png, image/webp, max 6MB
  photoFull: File; // image/jpeg, image/png, image/webp, max 6MB
}
```

**Response Contract:**
```typescript
interface RegistrationUpsertResponse {
  registrationId: string; // UUID
  photoSelfieUrl: string; // URL to uploaded image
  photoFullUrl: string; // URL to uploaded image
  success: boolean;
}
```

**Behavior:**
- Accepts multipart form data
- Validates file types and sizes
- Compresses images client-side
- Stores original + thumbnail versions
- Returns 200 on success, 400 on validation error, 413 on file too large

**Test Cases:**
- [ ] Valid registration with both photos succeeds
- [ ] File size validation (reject >6MB)
- [ ] MIME type validation (reject non-image)
- [ ] Image compression reduces file size
- [ ] Thumbnail generation works
- [ ] Invalid attendeeId returns 404

### API-003: Voting
**Endpoint**: `POST /api/vote/set`

**Request Contract:**
```typescript
interface VoteSetRequest {
  eventId: string; // UUID
  voterAttendeeId: string; // UUID (from cookie)
  category: 'funniest' | 'scariest' | 'cutest' | 'personalFavorite';
  targetRegistrationId: string; // UUID
}
```

**Response Contract:**
```typescript
interface VoteSetResponse {
  success: boolean;
  message?: string;
}
```

**Behavior:**
- Upserts vote by `(eventId, voterAttendeeId, category)`
- Validates voting window is open
- Validates target registration exists and is approved
- Returns 200 on success, 409 if voting closed, 400 on validation error

**Test Cases:**
- [ ] Valid vote succeeds and replaces previous
- [ ] Voting before opening time returns 409
- [ ] Voting after closing time returns 409
- [ ] Invalid target registration returns 400
- [ ] Cross-event vote returns 400
- [ ] Unapproved registration returns 400

### API-004: Registration List
**Endpoint**: `GET /api/registration/list?eventId={eventId}`

**Response Contract:**
```typescript
interface RegistrationListResponse {
  registrations: Array<{
    id: string; // UUID
    costumeTitle: string;
    photoSelfieUrl: string;
    photoFullUrl: string;
    displayName: string;
  }>;
  success: boolean;
}
```

**Behavior:**
- Returns only approved registrations
- Deterministic shuffle using `hash(eventId + attendeeId)` seed
- Requires attendee cookie for shuffle seed
- Returns 200 on success, 401 if no cookie

**Test Cases:**
- [ ] Returns only approved registrations
- [ ] Shuffle is deterministic per attendee
- [ ] Different attendees get different orders
- [ ] Same attendee gets same order on refresh
- [ ] No cookie returns 401

### API-005: Event Status
**Endpoint**: `GET /api/events/[eventId]/status`

**Response Contract:**
```typescript
interface EventStatusResponse {
  votingOpen: boolean;
  opensAtUTC: string; // ISO string
  closesAtUTC?: string; // ISO string
  nowUTC: string; // ISO string
  success: boolean;
}
```

**Behavior:**
- Calculates voting status based on current UTC time
- Returns current time for client countdown
- Returns 200 on success, 404 if event not found

**Test Cases:**
- [ ] Correctly identifies voting open/closed
- [ ] Returns accurate UTC timestamps
- [ ] Handles missing closing time
- [ ] Non-existent event returns 404

## Data Model Contracts

### Database Schema
```sql
-- Events table
CREATE TABLE Event (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  votingOpensAt TIMESTAMP WITH TIME ZONE NOT NULL,
  votingClosesAt TIMESTAMP WITH TIME ZONE,
  isPublicGallery BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendees table
CREATE TABLE Attendee (
  id UUID PRIMARY KEY,
  eventId UUID REFERENCES Event(id) ON DELETE CASCADE,
  displayName VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrations table
CREATE TABLE Registration (
  id UUID PRIMARY KEY,
  eventId UUID REFERENCES Event(id) ON DELETE CASCADE,
  attendeeId UUID REFERENCES Attendee(id) ON DELETE CASCADE,
  costumeTitle VARCHAR(255) NOT NULL,
  photoSelfieUrl TEXT NOT NULL,
  photoFullUrl TEXT NOT NULL,
  aiVariantUrl TEXT,
  isApproved BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE Vote (
  id UUID PRIMARY KEY,
  eventId UUID REFERENCES Event(id) ON DELETE CASCADE,
  voterAttendeeId UUID REFERENCES Attendee(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('funniest', 'scariest', 'cutest', 'personalFavorite')),
  targetRegistrationId UUID REFERENCES Registration(id) ON DELETE CASCADE,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_opens_at ON Event (votingOpensAt);
CREATE INDEX idx_attendees_event ON Attendee (eventId);
CREATE INDEX idx_reg_event ON Registration (eventId);
CREATE INDEX idx_reg_event_approved ON Registration (eventId, isApproved);
CREATE INDEX idx_reg_attendee ON Registration (attendeeId);
CREATE UNIQUE INDEX votes_unique ON Vote (eventId, voterAttendeeId, category);
CREATE INDEX idx_votes_target ON Vote (eventId, category, targetRegistrationId);
```

### TypeScript Interfaces
```typescript
type ID = string; // UUID
type Category = 'funniest' | 'scariest' | 'cutest' | 'personalFavorite';

interface Event {
  id: ID;
  name: string;
  votingOpensAt: string; // UTC ISO string
  votingClosesAt?: string; // UTC ISO string
  isPublicGallery?: boolean;
}

interface Attendee {
  id: ID;
  eventId: ID;
  displayName: string;
  createdAt: string; // UTC ISO
}

interface Registration {
  id: ID;
  eventId: ID;
  attendeeId: ID;
  costumeTitle: string;
  photoSelfieUrl: string;
  photoFullUrl: string;
  aiVariantUrl?: string;
  isApproved: boolean; // Default: true
  createdAt: string; // UTC ISO
  updatedAt: string; // UTC ISO
}

interface Vote {
  id: ID;
  eventId: ID;
  voterAttendeeId: ID;
  category: Category;
  targetRegistrationId: ID;
  createdAt: string; // UTC ISO (for tie-breaking)
  updatedAt: string; // UTC ISO
}
```

## Business Rules

### BR-001: Voting Window
**Rule**: Voting is only allowed between `votingOpensAt` and `votingClosesAt` (if set)
**Implementation**: Server validates UTC timestamps against current time
**Test**: Attempting to vote outside window returns 409 status

### BR-002: One Vote Per Category
**Rule**: Each attendee can vote for exactly one costume per category
**Implementation**: Unique constraint on `(eventId, voterAttendeeId, category)`
**Test**: Second vote in same category replaces first vote

### BR-003: Approved Registrations Only
**Rule**: Only approved registrations appear in voting deck
**Implementation**: Filter `isApproved = true` in registration list
**Test**: Unapproved registrations are excluded from voting

### BR-004: Deterministic Shuffle
**Rule**: Registration order is deterministic per attendee but random across attendees
**Implementation**: `seed = hash(eventId + attendeeId)` for shuffle algorithm
**Test**: Same attendee gets same order, different attendees get different orders

### BR-005: Tie-Breaking
**Rule**: Ties are broken by earliest `registration.createdAt`, then lowest `registration.id`
**Implementation**: ORDER BY clause in results query
**Test**: Consistent tie-breaking across multiple queries

## Security Requirements

### SEC-001: Cookie Security
**Requirement**: All cookies must use secure flags
**Implementation**: 
- Server-side: `cookies().set('attendee_[eventId]', attendeeId, { maxAge: 2592000, sameSite: 'lax', secure: true, path: '/' })`
- Use Next.js `cookies()` function in server components, server actions, and route handlers
- Flags: `Secure; SameSite=Lax; HttpOnly=false; Path=/`
**Test**: Cookie attributes verified in browser dev tools

### SEC-002: File Upload Validation
**Requirement**: Validate file types, sizes, and dimensions
**Implementation**: MIME type checking, size limits (6MB), dimension limits (4096px)
**Test**: Reject invalid files with appropriate error messages

### SEC-003: Rate Limiting
**Requirement**: Prevent abuse with rate limiting
**Implementation**: 10 votes/minute per `(IP, attendeeId)`
**Test**: Rate limit exceeded returns 429 status

### SEC-004: Cross-Event Protection
**Requirement**: Prevent votes across different events
**Implementation**: Validate `targetRegistrationId` belongs to same `eventId`
**Test**: Cross-event vote returns 400 status

## Performance Requirements

### PERF-001: Page Load Times
**Requirement**: All pages load in <2 seconds
**Implementation**: Image optimization, lazy loading, efficient queries
**Test**: Lighthouse performance score >90

### PERF-002: Photo Upload Speed
**Requirement**: Photo upload completes in <10 seconds
**Implementation**: Client-side compression, progress indicators
**Test**: Upload time measured and logged

### PERF-003: Voting Responsiveness
**Requirement**: Vote submission responds in <500ms
**Implementation**: Optimistic UI, efficient database queries
**Test**: Response time measured and logged

## Error Handling

### ERR-001: Network Interruption
**Requirement**: Graceful handling of network issues
**Implementation**: Retry logic, offline state management
**Test**: Simulate network failure and verify recovery

### ERR-002: Camera Permissions
**Requirement**: Fallback when camera access denied
**Implementation**: 
- Native HTML: `<input type="file" accept="image/*" capture="user">` (front camera) or `capture="environment"` (back camera)
- Browser support varies for `capture` attribute - always show file input as fallback
- File input fallback, clear error messages
**Test**: Deny camera permissions and verify fallback works

### ERR-003: File Upload Failure
**Requirement**: Clear error messages for upload failures
**Implementation**: Specific error codes, user-friendly messages
**Test**: Simulate upload failures and verify error handling

## Integration Points

### INT-001: QR Code Generation
**Requirement**: Generate QR codes for registration and voting URLs
**Implementation**: Static QR codes with eventId parameter
**Test**: QR codes scan correctly and navigate to correct URLs

### INT-002: Image Storage
**Requirement**: Store and serve uploaded images
**Implementation**: 
- Server: Use Route Handlers with `request.formData()` to read File objects directly
- Process with `sharp` for thumbnails (200-400px width)
- Store original + thumbnail (local filesystem, S3, or Cloudflare R2)
- Client compression: `browser-image-compression` (~1080px width, quality 0.7)
**Test**: Images upload, store, and serve correctly

### INT-003: Timezone Handling
**Requirement**: Convert between UTC and America/Vancouver timezone
**Implementation**: 
- Store all timestamps in UTC in database
- Server validates voting windows using UTC comparisons
- Client displays in America/Vancouver using `date-fns-tz`
- Format: Compare in UTC, display in local timezone
**Test**: Timezone conversion accuracy verified

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Goal**: Set up core infrastructure and data contracts

**Tasks:**
1. **Database Setup**
   - [ ] Install PostgreSQL and Prisma
   - [ ] Create database schema with all tables and indexes
   - [ ] Set up database connection and test queries
   - [ ] Create seed data for testing

2. **Type System**
   - [ ] Implement all TypeScript interfaces in `/types/db.ts`
   - [ ] Add validation utilities for UTC ISO strings
   - [ ] Create category enum and validation functions
   - [ ] Set up API request/response type contracts

3. **Cookie Management**
   - [ ] Implement cookie utilities for attendee management
   - [ ] Add cookie security flags and validation
   - [ ] Create middleware for cookie parsing
   - [ ] Test cookie persistence across sessions

**Acceptance Criteria:**
- [ ] Database schema matches specification exactly
- [ ] All TypeScript types compile without errors
- [ ] Cookie utilities work across different browsers
- [ ] Basic database queries execute successfully

### Phase 2: Registration Flow (Week 1-2)
**Goal**: Complete registration functionality

**Tasks:**
4. **Registration API**
   - [ ] Implement `POST /api/attendee/upsert` endpoint
   - [ ] Implement `POST /api/registration/upsert` with multipart handling
   - [ ] Add file upload validation (size, MIME, dimensions)
   - [ ] Implement image compression and thumbnail generation

5. **Registration UI**
   - [ ] Create `/r/[eventId]` page layout
   - [ ] Build name/costume input form
   - [ ] Implement camera capture components (front/back)
   - [ ] Add file upload fallback
   - [ ] Create review and submit flow
   - [ ] Add success state with voting QR link

6. **Photo Processing**
   - [ ] Implement client-side image compression
   - [ ] Add server-side thumbnail generation
   - [ ] Set up file storage (local or cloud)
   - [ ] Add progress indicators and error handling

**Acceptance Criteria:**
- [ ] Registration completes in <60 seconds
- [ ] Photo compression reduces file size by >50%
- [ ] Camera permissions fallback works
- [ ] Network interruption preserves local draft
- [ ] Cookie persists for 30 days

### Phase 3: Voting Flow (Week 2-3)
**Goal**: Complete voting functionality

**Tasks:**
7. **Voting API**
   - [ ] Implement `POST /api/vote/set` with upsert logic
   - [ ] Implement `GET /api/registration/list` with deterministic shuffle
   - [ ] Implement `GET /api/events/[eventId]/status` endpoint
   - [ ] Add vote validation and anti-abuse measures

8. **Voting UI**
   - [ ] Create `/v/[eventId]` page layout
   - [ ] Build tinder-style card component
   - [ ] Implement swipe gesture handling
   - [ ] Add category selection pills
   - [ ] Create "My picks" bottom sheet
   - [ ] Add voting countdown overlay

9. **Time Management**
   - [ ] Implement UTC to America/Vancouver timezone conversion
   - [ ] Add voting window validation
   - [ ] Create countdown timer component
   - [ ] Implement gallery view for pre-voting period

**Acceptance Criteria:**
- [ ] Voting disabled before opening time
- [ ] Each category allows exactly one selection
- [ ] Changing selection replaces previous choice
- [ ] Votes persist across page refreshes
- [ ] Voting completes in <5 minutes

### Phase 4: Results & Polish (Week 3-4)
**Goal**: Complete the experience

**Tasks:**
10. **Results System**
    - [ ] Implement vote counting and tie-breaking logic
    - [ ] Create `/results/[eventId]` page
    - [ ] Add winner display with photos
    - [ ] Implement vote count transparency

11. **Admin Features**
    - [ ] Implement `POST /api/registration/moderate` endpoint
    - [ ] Create simple admin interface for approval
    - [ ] Add emergency hide/unhide functionality

12. **Performance & UX**
    - [ ] Implement card virtualization for large registrations
    - [ ] Add optimistic UI updates
    - [ ] Implement offline state handling
    - [ ] Add loading states and error boundaries

**Acceptance Criteria:**
- [ ] Results match vote counts exactly
- [ ] Tie-breaking works consistently
- [ ] Results page loads in <2 seconds
- [ ] Admin can moderate registrations

### Phase 5: Testing & Deployment (Week 4)
**Goal**: Ship with confidence

**Tasks:**
13. **Testing**
    - [ ] Write API endpoint tests
    - [ ] Test mobile browser compatibility
    - [ ] Test cookie behavior across devices
    - [ ] Test photo upload functionality
    - [ ] Test complete voting flow

14. **Deployment**
    - [ ] Set up environment configuration
    - [ ] Run database migrations
    - [ ] Configure file storage
    - [ ] Generate QR codes
    - [ ] Set up production monitoring

**Acceptance Criteria:**
- [ ] All test cases pass
- [ ] Application deploys successfully
- [ ] QR codes work correctly
- [ ] Performance metrics meet requirements

## Test-Driven Development Checklist

### Unit Tests
- [ ] Cookie utilities (creation, parsing, validation)
- [ ] Timezone conversion functions
- [ ] Image compression utilities
- [ ] Vote counting and tie-breaking logic
- [ ] Deterministic shuffle algorithm

### Integration Tests
- [ ] API endpoint contracts
- [ ] Database operations
- [ ] File upload and storage
- [ ] Cookie persistence
- [ ] Voting window validation

### End-to-End Tests
- [ ] Complete registration flow
- [ ] Complete voting flow
- [ ] Results display
- [ ] Admin moderation
- [ ] Error handling scenarios

### Performance Tests
- [ ] Page load times
- [ ] Photo upload speeds
- [ ] Vote submission response times
- [ ] Database query performance
- [ ] Memory usage under load

## Definition of Done

### For Each Feature
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance requirements met
- [ ] Security requirements validated

### For Each API Endpoint
- [ ] Request/response contracts defined
- [ ] Validation implemented
- [ ] Error handling implemented
- [ ] Rate limiting implemented
- [ ] Tests written and passing
- [ ] Documentation updated

### For Each UI Component
- [ ] Responsive design implemented
- [ ] Accessibility requirements met
- [ ] Error states handled
- [ ] Loading states implemented
- [ ] Tests written and passing
- [ ] Cross-browser compatibility verified

## Risk Mitigation

### High-Risk Items
1. **Camera Permissions**: Test across different mobile browsers
2. **File Upload Size**: Ensure compression works on slow networks
3. **Voting Timing**: Test timezone handling thoroughly
4. **Cookie Persistence**: Test across different devices/browsers

### Contingency Plans
1. **Camera Issues**: Robust file upload fallback
2. **Network Issues**: Offline state management
3. **Voting Conflicts**: Clear error messages and retry logic
4. **Admin Access**: Simple password-protected admin route

## Success Metrics

### Technical Metrics
- Registration completion rate >90%
- Voting completion rate >85%
- Page load time <2 seconds
- Photo upload success rate >95%

### User Experience Metrics
- Time to complete registration <60 seconds
- Time to cast all votes <5 minutes
- Error rate <5%
- User satisfaction (qualitative feedback)

---

**Next Action**: Start with Phase 1, Task 1 (Database Setup) and Phase 1, Task 2 (Type System) as these are foundational and can be done in parallel.
