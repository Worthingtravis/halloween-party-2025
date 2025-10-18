'use client';

import React, { useState, useEffect } from 'react';
import { EventCard, EventStatus } from '@/components/EventCard';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Event {
  id: string;
  name: string;
  votingOpensAt: string;
  votingClosesAt?: string | null;
  registrationCount: number;
  status: EventStatus;
  votingOpen: boolean;
  hasOwnRegistration: boolean;
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | EventStatus>('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events/list');
        if (!res.ok) throw new Error('Failed to fetch events');
        const data = await res.json();
        setEvents(data.events);
      } catch (err) {
        setError('Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter((e) => e.status === filter);

  const activeCount = events.filter((e) => e.status === 'voting').length;
  const upcomingCount = events.filter((e) => e.status === 'registration' || e.status === 'upcoming').length;

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <LoadingState variant="spinner" size="lg" message="Loading events..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState 
          error={{ message: error }} 
          variant="page" 
          retry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              🎃 Halloween Costume Contests
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Vote for your favorite costumes, compete for prizes, and celebrate Halloween!
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="default" className="text-xs sm:text-sm">
                👥 {events.reduce((sum, e) => sum + e.registrationCount, 0)} Costumes
              </Badge>
              {activeCount > 0 && (
                <Badge variant="default" className="bg-green-500 text-xs sm:text-sm">
                  🗳️ {activeCount} Active {activeCount === 1 ? 'Contest' : 'Contests'}
                </Badge>
              )}
              {upcomingCount > 0 && (
                <Badge variant="secondary" className="text-xs sm:text-sm">
                  📅 {upcomingCount} Upcoming
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="text-4xl sm:text-6xl mb-4">🎃</div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">No events found</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              {filter === 'all' 
                ? 'No events available yet. Check back soon!' 
                : `No ${filter} events at the moment.`}
            </p>
            {filter !== 'all' && (
              <Button 
                variant="outline" 
                onClick={() => setFilter('all')} 
                className="mt-4"
              >
                View All Events
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t mt-12 sm:mt-16">
        <div className="container mx-auto px-4 py-6 sm:py-8 text-center">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Built with Next.js 15 • Prisma • Supabase • Shadcn UI
          </p>
        </div>
      </div>
    </div>
  );
}
