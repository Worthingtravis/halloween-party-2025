'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CostumeCard } from '@/components/CostumeCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { CountdownTimer } from '@/components/CountdownTimer';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Category, CATEGORIES } from '@/lib/validation';
import { getAttendeeCookieClient } from '@/lib/cookies-client';

interface Registration {
  id: string;
  costumeTitle: string;
  displayName: string;
  photoSelfieUrl: string;
  photoFullUrl: string;
}

interface EventStatusResponse {
  votingOpen: boolean;
  opensAtUTC: string;
  closesAtUTC?: string;
  nowUTC: string;
}

interface VotingPageProps {
  params: Promise<{ eventId: string }>;
}

export default function VotingPage({ params }: VotingPageProps) {
  const router = useRouter();
  const { eventId } = use(params);

  // Data state
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [eventStatus, setEventStatus] = useState<EventStatusResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category>('funniest');
  const [myVotes, setMyVotes] = useState<Record<Category, string | null>>({
    funniest: null,
    scariest: null,
    cutest: null,
    personalFavorite: null,
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votingError, setVotingError] = useState<string | null>(null);

  const attendeeId = getAttendeeCookieClient(eventId);

  // Fetch event status
  useEffect(() => {
    const fetchEventStatus = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/status`);
        if (!res.ok) throw new Error('Failed to fetch event status');
        const data = await res.json();
        setEventStatus(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load event status');
      }
    };

    fetchEventStatus();
    const interval = setInterval(fetchEventStatus, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [eventId]);

  // Fetch registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!attendeeId) {
        router.push(`/r/${eventId}`);
        return;
      }

      try {
        const res = await fetch(`/api/registration/list?eventId=${eventId}`);
        if (!res.ok) throw new Error('Failed to fetch registrations');
        const data = await res.json();
        setRegistrations(data.registrations);
      } catch (err) {
        console.error(err);
        setError('Failed to load costumes');
      } finally {
        setLoading(false);
      }
    };

    if (attendeeId) {
      fetchRegistrations();
    }
  }, [eventId, attendeeId, router]);

  const handleVote = async (registrationId: string) => {
    if (!attendeeId) return;

    // Optimistic UI update
    setMyVotes((prev) => ({ ...prev, [selectedCategory]: registrationId }));
    setVotingError(null);

    try {
      const res = await fetch('/api/vote/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          voterAttendeeId: attendeeId,
          category: selectedCategory,
          targetRegistrationId: registrationId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save vote');
      }
    } catch (err) {
      // Rollback optimistic update
      setMyVotes((prev) => ({ ...prev, [selectedCategory]: null }));
      setVotingError(err instanceof Error ? err.message : 'Failed to save vote');
    }
  };

  const handleNext = () => {
    if (currentIndex < registrations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <LoadingState variant="spinner" size="lg" message="Loading costumes..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState error={{ message: error }} variant="page" />
      </div>
    );
  }

  // Voting not open yet
  if (eventStatus && !eventStatus.votingOpen) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <CountdownTimer
          targetDate={eventStatus.opensAtUTC}
          variant="overlay"
          onComplete={() => window.location.reload()}
        />
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          error={{ message: 'No costumes registered yet. Be the first!' }}
          variant="page"
        />
      </div>
    );
  }

  const currentRegistration = registrations[currentIndex];
  const hasVotedForCurrent = myVotes[selectedCategory] === currentRegistration?.id;
  const totalVotesCast = Object.values(myVotes).filter(Boolean).length;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Header with My Picks */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vote for Costumes 🗳️</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline">
              My Picks ({totalVotesCast}/4)
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>My Picks</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              {CATEGORIES.map((cat) => (
                <div key={cat}>
                  <CategoryBadge category={cat} variant="badge" selected={!!myVotes[cat]} />
                  {myVotes[cat] && (
                    <p className="ml-2 mt-1 text-sm text-muted-foreground">
                      {registrations.find((r) => r.id === myVotes[cat])?.costumeTitle}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Category Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <CategoryBadge
            key={cat}
            category={cat}
            variant="pill"
            selected={selectedCategory === cat}
            onClick={() => setSelectedCategory(cat)}
          />
        ))}
      </div>

      {/* Voting Error */}
      {votingError && (
        <div className="mb-4">
          <ErrorState error={{ message: votingError }} variant="inline" />
        </div>
      )}

      {/* Costume Card */}
      {currentRegistration && (
        <div className="space-y-4">
          <CostumeCard registration={currentRegistration} variant="swipeable" />

          {/* Vote Button */}
          <Button
            onClick={() => handleVote(currentRegistration.id)}
            className="w-full"
            size="lg"
            variant={hasVotedForCurrent ? 'outline' : 'default'}
          >
            {hasVotedForCurrent ? '✓ Voted' : `Vote for ${selectedCategory}`}
          </Button>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              className="flex-1"
            >
              ← Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {registrations.length}
            </span>
            <Button
              onClick={handleNext}
              disabled={currentIndex === registrations.length - 1}
              variant="outline"
              className="flex-1"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Results Link (if voting closed) */}
      {eventStatus?.closesAtUTC && new Date() > new Date(eventStatus.closesAtUTC) && (
        <div className="mt-6">
          <Button onClick={() => router.push(`/results/${eventId}`)} className="w-full">
            View Results
          </Button>
        </div>
      )}
    </div>
  );
}

