'use client';

import React, { useState, useEffect, use } from 'react';
import { CostumeCard } from '@/components/CostumeCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Category, CATEGORIES } from '@/lib/validation';

interface Registration {
  id: string;
  costumeTitle: string;
  displayName: string;
  photoSelfieUrl: string;
  photoFullUrl: string;
  voteCount?: number;
  isWinner?: boolean;
}

interface CategoryResult {
  category: Category;
  entries: Registration[];
  maxVotes: number;
  isTie: boolean;
}

interface ResultsPageProps {
  params: Promise<{ eventId: string }>;
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { eventId } = use(params);

  const [results, setResults] = useState<CategoryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const downloadAllPhotos = async () => {
    if (downloading) return;
    
    setDownloading(true);
    try {
      const allEntries = results.flatMap(r => r.entries);
      
      for (let i = 0; i < allEntries.length; i++) {
        const entry = allEntries[i];
        const sanitizedTitle = entry.costumeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const sanitizedName = entry.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        // Download selfie
        await downloadImage(
          entry.photoSelfieUrl,
          `${i + 1}_${sanitizedName}_${sanitizedTitle}_selfie.jpg`
        );
        
        // Small delay to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Download full photo
        await downloadImage(
          entry.photoFullUrl,
          `${i + 1}_${sanitizedName}_${sanitizedTitle}_full.jpg`
        );
        
        // Small delay between entries
        if (i < allEntries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Failed to download all photos:', error);
    } finally {
      setDownloading(false);
    }
  };

  const downloadEntryPhotos = async (entry: Registration) => {
    const sanitizedTitle = entry.costumeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const sanitizedName = entry.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    await downloadImage(
      entry.photoSelfieUrl,
      `${sanitizedName}_${sanitizedTitle}_selfie.jpg`
    );
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await downloadImage(
      entry.photoFullUrl,
      `${sanitizedName}_${sanitizedTitle}_full.jpg`
    );
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const resultsRes = await fetch(`/api/results/${eventId}`);
        if (!resultsRes.ok) throw new Error('Failed to fetch results');
        const { results } = await resultsRes.json();

        setResults(results);
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
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Contest Results</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          All entries ranked by votes in each category
        </p>
        <div className="mt-4 flex justify-center">
          <Button
            onClick={downloadAllPhotos}
            disabled={downloading || results.length === 0}
            size="lg"
            className="gap-2"
          >
            <Download className="h-5 w-5" />
            {downloading ? 'Downloading...' : 'Download All Photos'}
          </Button>
        </div>
      </div>

      <div className="space-y-8">
        {results.map((categoryResult) => (
          <Card key={categoryResult.category} className="overflow-hidden border-2">
            <CardHeader className="bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  <CategoryBadge
                    category={categoryResult.category}
                    variant="result"
                    count={categoryResult.maxVotes}
                  />
                </CardTitle>
                {categoryResult.isTie && (
                  <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                    Tie
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {categoryResult.entries.length > 0 ? (
                <div className="space-y-6">
                  {categoryResult.isTie && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                        🏆 {categoryResult.entries.filter((e) => e.isWinner).length}-way tie for first place with {categoryResult.maxVotes} votes!
                      </p>
                    </div>
                  )}
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {categoryResult.entries.map((entry) => (
                      <div 
                        key={entry.id} 
                        className={`relative flex flex-col space-y-3 rounded-lg border p-4 ${
                          entry.isWinner 
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20' 
                            : 'border-border bg-card'
                        }`}
                      >
                        <Button
                          onClick={() => downloadEntryPhotos(entry)}
                          size="icon"
                          variant="outline"
                          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                          title="Download photos"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {entry.isWinner && (
                          <div className="flex justify-center">
                            <span className="inline-flex items-center rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                              🏆 Winner
                            </span>
                          </div>
                        )}
                        <CostumeCard registration={entry} variant="static" />
                        <div className="space-y-2 text-center">
                          <h3 className="text-lg font-bold tracking-tight">{entry.costumeTitle}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {entry.displayName}
                          </p>
                          <div className={`rounded-lg border p-3 ${
                            entry.isWinner 
                              ? 'border-amber-500 bg-amber-100 dark:bg-amber-950/40' 
                              : 'bg-muted/50'
                          }`}>
                            <p className="text-xs font-medium text-muted-foreground">Votes</p>
                            <p className={`text-2xl font-bold tracking-tight ${
                              entry.isWinner ? 'text-amber-600 dark:text-amber-400' : ''
                            }`}>
                              {entry.voteCount}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="py-8 text-center text-muted-foreground">No entries for this category</p>
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
              All entries ranked by vote count within each category.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

