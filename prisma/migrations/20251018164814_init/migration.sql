-- CreateEnum
CREATE TYPE "VoteCategory" AS ENUM ('funniest', 'scariest', 'cutest', 'personalFavorite');

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "votingOpensAt" TIMESTAMPTZ(6) NOT NULL,
    "votingClosesAt" TIMESTAMPTZ(6),
    "isPublicGallery" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendee" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "attendeeId" UUID NOT NULL,
    "costumeTitle" VARCHAR(255) NOT NULL,
    "photoSelfieUrl" TEXT NOT NULL,
    "photoFullUrl" TEXT NOT NULL,
    "aiVariantUrl" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "voterAttendeeId" UUID NOT NULL,
    "category" "VoteCategory" NOT NULL,
    "targetRegistrationId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_events_opens_at" ON "Event"("votingOpensAt");

-- CreateIndex
CREATE INDEX "idx_attendees_event" ON "Attendee"("eventId");

-- CreateIndex
CREATE INDEX "idx_reg_event" ON "Registration"("eventId");

-- CreateIndex
CREATE INDEX "idx_reg_event_approved" ON "Registration"("eventId", "isApproved");

-- CreateIndex
CREATE INDEX "idx_reg_attendee" ON "Registration"("attendeeId");

-- CreateIndex
CREATE INDEX "idx_votes_target" ON "Vote"("eventId", "category", "targetRegistrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_eventId_voterAttendeeId_category_key" ON "Vote"("eventId", "voterAttendeeId", "category");

-- AddForeignKey
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "Attendee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterAttendeeId_fkey" FOREIGN KEY ("voterAttendeeId") REFERENCES "Attendee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_targetRegistrationId_fkey" FOREIGN KEY ("targetRegistrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
