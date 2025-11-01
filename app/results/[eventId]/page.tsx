'use client';

import React, { useState, useEffect, use } from 'react';
import { CostumeCard } from '@/components/CostumeCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Image as ImageIcon, CheckSquare, Square, Share2 } from 'lucide-react';
import { Category, CATEGORIES } from '@/lib/validation';
import JSZip from 'jszip';

interface Registration {
  id: string;
  costumeTitle: string;
  displayName: string;
  photoSelfieUrl: string;
  photoFullUrl: string;
  voteCount?: number;
  isWinner?: boolean;
}

interface OverallTopEntry {
  id: string;
  costumeTitle: string;
  displayName: string;
  photoSelfieUrl: string;
  photoFullUrl: string;
  totalVotes: number;
  rank: number;
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

interface PhotoSelection {
  entryId: string;
  entryName: string;
  selfie: boolean;
  full: boolean;
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { eventId } = use(params);

  const [results, setResults] = useState<CategoryResult[]>([]);
  const [top3Overall, setTop3Overall] = useState<OverallTopEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [photoSelections, setPhotoSelections] = useState<Map<string, PhotoSelection>>(new Map());

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

  const fetchImageAsBlob = async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
    return await response.blob();
  };

  const downloadAllPhotos = async () => {
    if (downloading) return;
    
    setDownloading(true);
    setDownloadProgress('Preparing download...');
    
    try {
      const zip = new JSZip();
      const allEntries = results.flatMap(r => r.entries);
      const totalPhotos = allEntries.length * 2; // selfie + full
      let downloaded = 0;
      
      for (let i = 0; i < allEntries.length; i++) {
        const entry = allEntries[i];
        const sanitizedTitle = entry.costumeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const sanitizedName = entry.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        // Download selfie
        setDownloadProgress(`Downloading ${downloaded + 1}/${totalPhotos} photos...`);
        const selfieBlob = await fetchImageAsBlob(entry.photoSelfieUrl);
        zip.file(`${i + 1}_${sanitizedName}_${sanitizedTitle}_selfie.jpg`, selfieBlob);
        downloaded++;
        
        // Download full photo
        setDownloadProgress(`Downloading ${downloaded + 1}/${totalPhotos} photos...`);
        const fullBlob = await fetchImageAsBlob(entry.photoFullUrl);
        zip.file(`${i + 1}_${sanitizedName}_${sanitizedTitle}_full.jpg`, fullBlob);
        downloaded++;
      }
      
      // Generate zip file
      setDownloadProgress('Creating zip file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download zip
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `halloween-contest-photos-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      setDownloadProgress('');
    } catch (error) {
      console.error('Failed to download all photos:', error);
      setDownloadProgress('');
    } finally {
      setDownloading(false);
    }
  };

  const downloadEntryPhotos = async (entry: Registration | OverallTopEntry) => {
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

  const shareEntry = async (entry: Registration | OverallTopEntry) => {
    const shareText = `Check out ${entry.displayName}'s costume: "${entry.costumeTitle}" from our Halloween Contest! 🎃`;
    const shareUrl = window.location.href;

    // Try Web Share API first (works great on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${entry.costumeTitle} - Halloween Contest`,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback: Copy link to clipboard and show options
      const encodedText = encodeURIComponent(shareText);
      const encodedUrl = encodeURIComponent(shareUrl);
      
      // Create a simple modal with share options
      const shareLinks = [
        {
          name: 'Twitter',
          url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        },
        {
          name: 'Facebook',
          url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
        },
        {
          name: 'WhatsApp',
          url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
        },
        {
          name: 'Copy Link',
          action: async () => {
            try {
              await navigator.clipboard.writeText(shareUrl);
              alert('Link copied to clipboard!');
            } catch (err) {
              console.error('Failed to copy:', err);
            }
          },
        },
      ];

      // Open first available share option (Twitter)
      const selectedLink = shareLinks[0];
      window.open(selectedLink.url, '_blank', 'width=600,height=400');
    }
  };

  const openPhotoSelector = () => {
    setShowPhotoSelector(true);
  };

  const togglePhotoSelection = (entryId: string, photoType: 'selfie' | 'full') => {
    setPhotoSelections(prev => {
      const newSelections = new Map(prev);
      const selection = newSelections.get(entryId);
      if (selection) {
        selection[photoType] = !selection[photoType];
        newSelections.set(entryId, selection);
      }
      return newSelections;
    });
  };

  const selectAllPhotos = () => {
    setPhotoSelections(prev => {
      const newSelections = new Map(prev);
      newSelections.forEach(selection => {
        selection.selfie = true;
        selection.full = true;
      });
      return newSelections;
    });
  };

  const deselectAllPhotos = () => {
    setPhotoSelections(prev => {
      const newSelections = new Map(prev);
      newSelections.forEach(selection => {
        selection.selfie = false;
        selection.full = false;
      });
      return newSelections;
    });
  };

  const downloadSelectedPhotos = async () => {
    setDownloading(true);
    setShowPhotoSelector(false);
    setDownloadProgress('Preparing download...');

    try {
      const zip = new JSZip();
      const allEntries = results.flatMap(r => r.entries);
      const selectedCount = getSelectedCount();
      let downloaded = 0;

      for (const entry of allEntries) {
        const selection = photoSelections.get(entry.id);
        if (!selection || (!selection.selfie && !selection.full)) continue;

        const sanitizedTitle = entry.costumeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const sanitizedName = entry.displayName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        if (selection.selfie) {
          setDownloadProgress(`Downloading ${downloaded + 1}/${selectedCount} photos...`);
          const selfieBlob = await fetchImageAsBlob(entry.photoSelfieUrl);
          zip.file(`${sanitizedName}_${sanitizedTitle}_selfie.jpg`, selfieBlob);
          downloaded++;
        }

        if (selection.full) {
          setDownloadProgress(`Downloading ${downloaded + 1}/${selectedCount} photos...`);
          const fullBlob = await fetchImageAsBlob(entry.photoFullUrl);
          zip.file(`${sanitizedName}_${sanitizedTitle}_full.jpg`, fullBlob);
          downloaded++;
        }
      }

      // Generate zip file
      setDownloadProgress('Creating zip file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download zip
      const now = new Date();
      const timestamp = now.toISOString().split('T')[0];
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `halloween-contest-selected-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      setDownloadProgress('');
    } catch (error) {
      console.error('Failed to download selected photos:', error);
      setDownloadProgress('');
    } finally {
      setDownloading(false);
    }
  };

  const getSelectedCount = () => {
    let count = 0;
    photoSelections.forEach(selection => {
      if (selection.selfie) count++;
      if (selection.full) count++;
    });
    return count;
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const resultsRes = await fetch(`/api/results/${eventId}`);
        if (!resultsRes.ok) throw new Error('Failed to fetch results');
        const { results, top3Overall } = await resultsRes.json();

        setResults(results);
        setTop3Overall(top3Overall || []);

        // Initialize photo selections
        const allEntries = results.flatMap((r: CategoryResult) => r.entries);
        const selections = new Map<string, PhotoSelection>();
        allEntries.forEach((entry: Registration) => {
          selections.set(entry.id, {
            entryId: entry.id,
            entryName: `${entry.displayName} - ${entry.costumeTitle}`,
            selfie: false,
            full: false,
          });
        });
        setPhotoSelections(selections);
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
        <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
          <Button
            onClick={downloadAllPhotos}
            disabled={downloading || results.length === 0}
            size="lg"
            className="gap-2 w-full sm:w-auto"
            variant="outline"
          >
            <Download className="h-5 w-5" />
            {downloading ? downloadProgress || 'Downloading...' : 'Download All as ZIP'}
          </Button>
          <Button
            onClick={openPhotoSelector}
            disabled={downloading || results.length === 0}
            size="lg"
            className="gap-2 w-full sm:w-auto"
          >
            <CheckSquare className="h-5 w-5" />
            Select Photos to Download
          </Button>
        </div>
      </div>

      {/* Photo Selection Dialog */}
      <Dialog open={showPhotoSelector} onOpenChange={setShowPhotoSelector}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full h-[90vh] sm:h-auto sm:max-h-[80vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl">Select Photos to Download</DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choose which photos you want to download. Selected: <span className="font-semibold">{getSelectedCount()} photo{getSelectedCount() !== 1 ? 's' : ''}</span>
            </p>
          </DialogHeader>
          
          <div className="flex gap-2 mb-3 sm:mb-4 flex-shrink-0">
            <Button onClick={selectAllPhotos} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden xs:inline">Select All</span>
              <span className="xs:hidden">All</span>
            </Button>
            <Button onClick={deselectAllPhotos} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial">
              <Square className="h-4 w-4" />
              <span className="hidden xs:inline">Deselect All</span>
              <span className="xs:hidden">None</span>
            </Button>
          </div>

          <ScrollArea className="flex-1 -mx-4 sm:mx-0 px-4 sm:pr-4">
            <div className="space-y-3 sm:space-y-4">
              {results.flatMap(r => r.entries).map((entry) => {
                const selection = photoSelections.get(entry.id);
                if (!selection) return null;

                return (
                  <Card key={entry.id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 mx-auto sm:mx-0 relative overflow-hidden rounded-lg border-2">
                        <img
                          src={entry.photoSelfieUrl}
                          alt={entry.costumeTitle}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-semibold text-base sm:text-lg line-clamp-1">{entry.costumeTitle}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3">by {entry.displayName}</p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
                          <div 
                            className="flex items-center justify-center sm:justify-start space-x-2 p-2 sm:p-0 rounded-lg sm:rounded-none bg-muted/50 sm:bg-transparent cursor-pointer"
                            onClick={() => togglePhotoSelection(entry.id, 'selfie')}
                          >
                            <Checkbox
                              id={`${entry.id}-selfie`}
                              checked={selection.selfie}
                              onCheckedChange={() => togglePhotoSelection(entry.id, 'selfie')}
                              className="h-5 w-5 sm:h-4 sm:w-4"
                            />
                            <label
                              htmlFor={`${entry.id}-selfie`}
                              className="text-sm sm:text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                            >
                              <ImageIcon className="h-4 w-4" />
                              Selfie Photo
                            </label>
                          </div>
                          <div 
                            className="flex items-center justify-center sm:justify-start space-x-2 p-2 sm:p-0 rounded-lg sm:rounded-none bg-muted/50 sm:bg-transparent cursor-pointer"
                            onClick={() => togglePhotoSelection(entry.id, 'full')}
                          >
                            <Checkbox
                              id={`${entry.id}-full`}
                              checked={selection.full}
                              onCheckedChange={() => togglePhotoSelection(entry.id, 'full')}
                              className="h-5 w-5 sm:h-4 sm:w-4"
                            />
                            <label
                              htmlFor={`${entry.id}-full`}
                              className="text-sm sm:text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                            >
                              <ImageIcon className="h-4 w-4" />
                              Full Photo
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPhotoSelector(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={downloadSelectedPhotos} 
              disabled={getSelectedCount() === 0 || downloading}
              className="gap-2 w-full sm:w-auto order-1 sm:order-2"
            >
              <Download className="h-4 w-4" />
              {downloading ? downloadProgress : `Download as ZIP (${getSelectedCount()} photo${getSelectedCount() !== 1 ? 's' : ''})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top 3 Overall Section */}
      {top3Overall.length > 0 && (
        <Card className="mb-8 overflow-hidden border-4 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
          <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <CardTitle className="text-center text-2xl">
              🏆 Top 3 Overall - Most Voted Costumes 🏆
            </CardTitle>
            <p className="text-center text-sm text-amber-50">
              Ranked by total votes across all categories
            </p>
          </CardHeader>
          <CardContent className="pt-8">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
              {top3Overall.map((entry) => (
                <div 
                  key={entry.id}
                  className="relative flex flex-col space-y-3 rounded-lg border-2 border-amber-500 bg-white dark:bg-gray-950 p-4 shadow-lg"
                >
                  <Button
                    onClick={() => shareEntry(entry)}
                    size="icon"
                    variant="outline"
                    className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    title="Share this costume"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <div className="flex justify-center">
                    <div className={`inline-flex items-center rounded-full px-4 py-2 text-lg font-bold text-white ${
                      entry.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      entry.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                      'bg-gradient-to-r from-orange-400 to-orange-600'
                    }`}>
                      {entry.rank === 1 ? '🥇 1st Place' : entry.rank === 2 ? '🥈 2nd Place' : '🥉 3rd Place'}
                    </div>
                  </div>
                  <CostumeCard registration={entry} variant="static" />
                  <div className="space-y-2 text-center">
                    <h3 className="text-xl font-bold tracking-tight">{entry.costumeTitle}</h3>
                    <p className="text-base text-muted-foreground">
                      by {entry.displayName}
                    </p>
                    <div className="rounded-lg border-2 border-amber-500 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Votes</p>
                      <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                        {entry.totalVotes}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                          onClick={() => shareEntry(entry)}
                          size="icon"
                          variant="outline"
                          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                          title="Share this costume"
                        >
                          <Share2 className="h-4 w-4" />
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

