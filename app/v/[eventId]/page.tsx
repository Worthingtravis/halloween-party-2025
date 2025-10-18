'use client';

import { CategoryBadge } from '@/components/CategoryBadge';
import { CostumeCard } from '@/components/CostumeCard';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getAttendeeCookieClient } from '@/lib/cookies-client';
import { formatEventTime } from '@/lib/timezone';
import { cn } from '@/lib/utils';
import { CATEGORIES, Category, CATEGORY_CONFIG } from '@/lib/validation';
import { AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState, useRef } from 'react';

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
  const [eventStatus, setEventStatus] = useState<EventStatusResponse | null>(
    null
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] =
    useState<Category>('funniest');
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
  const [hasOwnRegistration, setHasOwnRegistration] = useState(false);
  const [myPicksOpen, setMyPicksOpen] = useState(false);
  const [isProcessingVote, setIsProcessingVote] = useState(false);

  const attendeeId = getAttendeeCookieClient(eventId);

  // Debouncing ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute preview mode from existing state (avoid re-render loop)
  const isPreviewMode =
    eventStatus && !eventStatus.votingOpen && hasOwnRegistration;

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

  // Fetch registrations and votes
  useEffect(() => {
    const fetchData = async () => {
      // Check if voting has closed - if so, allow public access
      const votingClosed = eventStatus?.closesAtUTC && new Date() > new Date(eventStatus.closesAtUTC);
      
      if (!attendeeId && !votingClosed) {
        router.push(`/r/${eventId}`);
        return;
      }

      try {
        // Fetch registrations (use public flag if no attendee and voting closed)
        const publicParam = !attendeeId && votingClosed ? '&public=true' : '';
        const regRes = await fetch(`/api/registration/list?eventId=${eventId}${publicParam}`);
        if (!regRes.ok) throw new Error('Failed to fetch registrations');
        const regData = await regRes.json();
        setRegistrations(regData.registrations);
        setHasOwnRegistration(regData.hasOwnRegistration);

        // Fetch existing votes (only if attendee exists)
        if (attendeeId) {
          const votesRes = await fetch(`/api/vote/list?eventId=${eventId}`);
          if (votesRes.ok) {
            const votesData = await votesRes.json();
            if (votesData.success && votesData.votes) {
              // Restore votes from server
              setMyVotes({
                funniest: votesData.votes.funniest || null,
                scariest: votesData.votes.scariest || null,
                cutest: votesData.votes.cutest || null,
                personalFavorite: votesData.votes.personalFavorite || null,
              });
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load costumes');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId, attendeeId, router, eventStatus]);

  // Clear errors when navigating between costumes
  useEffect(() => {
    setVotingError(null);
  }, [currentIndex]);



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

  const handleSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      // Swipe left → next
      handleNext();
    } else {
      // Swipe right → previous
      handlePrevious();
    }
  };

  const handleCategorySwitch = async (newCategory: Category) => {
    // Prevent multiple simultaneous requests
    if (isProcessingVote) {
      return;
    }

    // Clear any errors when switching categories
    setVotingError(null);

    if (!attendeeId || !currentRegistration) {
      setSelectedCategory(newCategory);
      return;
    }

    // Check if current costume is voted for in ANY category
    const currentVoteCategory = CATEGORIES.find(
      (cat) => myVotes[cat] === currentRegistration.id
    );

    // Check if we're already voting for this costume in the selected category
    if (myVotes[newCategory] === currentRegistration.id) {
      // Just switch to the category, nothing to do
      setSelectedCategory(newCategory);
      return;
    }

    // Mark as processing to prevent duplicate requests
    setIsProcessingVote(true);

    // Optimistically update UI: set the vote for the new category AND switch category immediately
    const previousVotes = { ...myVotes };
    const previousCategory = selectedCategory;

    // Update selected category IMMEDIATELY for instant UI feedback
    setSelectedCategory(newCategory);

    // If costume was voted in another category, remove it from there
    if (currentVoteCategory && currentVoteCategory !== newCategory) {
      setMyVotes((prev) => ({
        ...prev,
        [currentVoteCategory]: null,
        [newCategory]: currentRegistration.id,
      }));
    } else {
      // Just set the vote for the new category (replaces any existing vote there)
      setMyVotes((prev) => ({
        ...prev,
        [newCategory]: currentRegistration.id,
      }));
    }

    try {
      // If there was a vote in another category for this costume, remove it
      if (currentVoteCategory && currentVoteCategory !== newCategory) {
        await fetch('/api/vote/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            voterAttendeeId: attendeeId,
            category: currentVoteCategory,
          }),
        });
      }

      // Set the new vote (upsert will replace any existing vote in this category)
      const res = await fetch('/api/vote/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          voterAttendeeId: attendeeId,
          category: newCategory,
          targetRegistrationId: currentRegistration.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to vote');
      }
    } catch (err) {
      // Rollback on error - restore both votes and selected category
      setMyVotes(previousVotes);
      setSelectedCategory(previousCategory);
      setVotingError(err instanceof Error ? err.message : 'Failed to vote');
    } finally {
      // Allow new requests after a short delay
      setTimeout(() => {
        setIsProcessingVote(false);
      }, 300);
    }
  };

  // Debounced version of handleCategorySwitch
  const debouncedCategorySwitch = (newCategory: Category) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      handleCategorySwitch(newCategory);
    }, 300); // 300ms debounce delay
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <LoadingState
          variant="spinner"
          size="lg"
          message="Loading costumes..."
        />
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

  // Voting not open yet - show countdown for non-registered attendees
  if (eventStatus && !eventStatus.votingOpen && !hasOwnRegistration) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <div className="flex flex-col items-center gap-6">
          <CountdownTimer
            targetDate={eventStatus.opensAtUTC}
            variant="overlay"
            onComplete={() => window.location.reload()}
          />
          <div className="text-center space-y-4 max-w-md">
            <p className="text-muted-foreground">
              Want to join the contest?
            </p>
            <Button 
              onClick={() => router.push(`/r/${eventId}`)}
              size="lg"
              className="min-h-[48px]"
            >
              Register Your Costume 🎃
            </Button>
          </div>
        </div>
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

  const totalVotesCast = Object.values(myVotes).filter(Boolean).length;

  const costumeNameForCategory = (category: Category) => {
    return registrations.find((r) => r.id === myVotes[category])?.costumeTitle;
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      {/* Preview Mode Banner */}
      {isPreviewMode && eventStatus && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 border border-blue-200">
          <p className="text-sm text-blue-900">
            Preview Mode - Voting opens{' '}
            {formatEventTime(eventStatus.opensAtUTC)}
          </p>
        </div>
      )}

      {/* My Picks - Fixed Position */}
      {!isPreviewMode && (
        <Sheet open={myPicksOpen} onOpenChange={setMyPicksOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="fixed top-4 right-[72px] z-40 min-h-[44px] gap-2 bg-background/80 backdrop-blur-sm border shadow-sm hover:bg-accent"
            >
              <span className="text-lg">🗳️</span>
              <span className="hidden sm:inline">My Picks</span>
              <span className={cn(
                "ml-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                totalVotesCast === 4 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              )}>
                {totalVotesCast}/4
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col p-0">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>My Picks</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const voted = !!myVotes[cat];
                  const votedRegistration = voted ? registrations.find((r) => r.id === myVotes[cat]) : null;
                  
                  const handlePickClick = () => {
                    if (!voted || !votedRegistration) return;
                    
                    // Find the index of the voted costume
                    const targetIndex = registrations.findIndex((r) => r.id === myVotes[cat]);
                    if (targetIndex !== -1) {
                      setCurrentIndex(targetIndex);
                      setSelectedCategory(cat);
                      setMyPicksOpen(false); // Close the sheet
                    }
                  };
                  
                  return (
                    <div 
                      key={cat} 
                      onClick={handlePickClick}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-colors",
                        voted ? "border-green-500 bg-green-50 dark:bg-green-950 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900" : "border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{config.icon}</span>
                        <span className="font-semibold">{config.label}</span>
                        {voted && <Check className="w-4 h-4 ml-auto text-green-600" />}
                      </div>
                      {voted ? (
                        <p className="text-sm text-muted-foreground ml-7">
                          {votedRegistration?.costumeTitle}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground ml-7">Not voted yet</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Vote for Costumes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Swipe or tap to browse • Vote in 4 categories
        </p>
      </div>

      {/* Voting Error */}
      {votingError && (
        <div className="mb-4">
          <ErrorState error={{ message: votingError }} variant="inline" />
        </div>
      )}

      {/* Costume Card */}
      {currentRegistration && (
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            <CostumeCard
              key={currentRegistration.id}
              registration={currentRegistration}
              variant="swipeable"
              onSwipe={handleSwipe}
            />
          </AnimatePresence>

          {/* Category Selection */}
          {!isPreviewMode && (
            <div className="space-y-2">
           
              <ButtonGroup className="w-full">
                {CATEGORIES.map((cat) => {
                  const config = CATEGORY_CONFIG[cat];
                  const hasVotedInCategory = !!myVotes[cat];
                  const currentCostumeVotedInThisCategory =
                    myVotes[cat] === currentRegistration.id;

                  return (
                    <Button
                      key={cat}
                      onClick={() => debouncedCategorySwitch(cat)}
                      variant={currentCostumeVotedInThisCategory ? 'default' : 'outline'}
                      size="sm"
                      disabled={isProcessingVote}
                      className={cn(
                        'flex-1 touch-manipulation gap-1.5 min-h-[44px] relative transition-all',
                        currentCostumeVotedInThisCategory && 'bg-green-600 hover:bg-green-700 border-green-600',
                        hasVotedInCategory && !currentCostumeVotedInThisCategory && 'opacity-50'
                      )}
                    >
                      <span className="text-xl sm:text-lg">{config.icon}</span>
                      <span className="hidden sm:inline text-xs font-medium">
                        {config.label}
                      </span>
                      {hasVotedInCategory && (
                        <Check className={cn(
                          "w-4 h-4 absolute -top-1 -right-1 rounded-full",
                          currentCostumeVotedInThisCategory ? "text-white" : "text-green-600 bg-white"
                        )} />
                      )}
                    </Button>
                  );
                })}
              </ButtonGroup>
              {/* Show info about current votes */}
              <div className="flex flex-wrap gap-2 justify-center mt-3">
                {CATEGORIES.map((cat) => {
                  if (!myVotes[cat]) return null;
                  const config = CATEGORY_CONFIG[cat];
                  const costume = registrations.find((r) => r.id === myVotes[cat]);
                  const isCurrentCostume = myVotes[cat] === currentRegistration.id;
                  
                  const handleBadgeClick = () => {
                    if (!myVotes[cat]) return;
                    
                    // Find the index of the voted costume
                    const targetIndex = registrations.findIndex((r) => r.id === myVotes[cat]);
                    if (targetIndex !== -1) {
                      setCurrentIndex(targetIndex);
                      setSelectedCategory(cat);
                    }
                  };
                  
                  return (
                    <div
                      key={cat}
                      onClick={handleBadgeClick}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                        isCurrentCostume 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 ring-2 ring-green-500"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      <span>{config.icon}</span>
                      <span className="hidden sm:inline">{config.label}:</span>
                      <span className="font-semibold truncate max-w-[120px]">{costume?.costumeTitle}</span>
                      {isCurrentCostume && <Check className="w-3 h-3" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview Mode Message */}
          {isPreviewMode && (
            <div className="w-full rounded-lg bg-gray-100 p-4 text-center">
              <p className="text-gray-600">
                Voting opens soon - Browse entries now!
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between gap-4 mt-6">
            <Button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              variant="outline"
              size="lg"
              className="min-h-[48px] flex-1 max-w-[140px]"
            >
              ← Previous
            </Button>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {currentIndex + 1}
              </div>
              <div className="text-xs text-muted-foreground">
                of {registrations.length}
              </div>
            </div>
            <Button
              onClick={handleNext}
              disabled={currentIndex === registrations.length - 1}
              variant="outline"
              size="lg"
              className="min-h-[48px] flex-1 max-w-[140px]"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Results Link (if voting closed) */}
      {eventStatus?.closesAtUTC &&
        new Date() > new Date(eventStatus.closesAtUTC) && (
          <div className="mt-6">
            <Button
              onClick={() => router.push(`/results/${eventId}`)}
              className="w-full"
            >
              View Results
            </Button>
          </div>
        )}
    </div>
  );
}
