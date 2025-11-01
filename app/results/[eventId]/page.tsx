'use client';

import React, { useState, useEffect, use } from 'react';
import { CostumeCard } from '@/components/CostumeCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Category, CATEGORIES } from '@/lib/validation';

interface Registration {
  id: string;
  costumeTitle: string;
  displayName: string;
  photoSelfieUrl: string;
  photoFullUrl: string;
}

interface CategoryWinner {
  category: Category;
  winner: Registration | null;
  voteCount: number;
  isTie: boolean;
}

interface ResultsPageProps {
  params: Promise<{ eventId: string }>;
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { eventId } = use(params);

  const [winners, setWinners] = useState<CategoryWinner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const resultsRes = await fetch(`/api/results/${eventId}`);
        if (!resultsRes.ok) throw new Error('Failed to fetch results');
        const { results } = await resultsRes.json();

        setWinners(results);
      } catch (err) {
        console.error(err);
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [eventId]);

  if (loading) {
    return (
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <LoadingState variant="spinner" size="lg" message="Loading results..." />
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

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Contest Winners</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Congratulations to all our amazing contestants!
        </p>
      </div>

      <div className="space-y-6">
        {winners.map((categoryWinner) => (
          <Card key={categoryWinner.category} className="overflow-hidden border-2">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  <CategoryBadge
                    category={categoryWinner.category}
                    variant="result"
                    count={categoryWinner.voteCount}
                  />
                </CardTitle>
                {categoryWinner.isTie && (
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                    Tie
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {categoryWinner.winner ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <CostumeCard registration={categoryWinner.winner} variant="static" />
                  <div className="flex flex-col justify-center space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold tracking-tight">{categoryWinner.winner.costumeTitle}</h3>
                      <p className="text-lg text-muted-foreground">
                        by {categoryWinner.winner.displayName}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Votes</p>
                      <p className="text-3xl font-bold tracking-tight">
                        {categoryWinner.voteCount}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">No winner for this category</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <Card className="border-2">
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Thanks for participating!
              <br />
              Winners determined by popular vote.
              <br />
              Ties broken by earliest registration time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

