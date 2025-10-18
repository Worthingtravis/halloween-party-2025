'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PhotoCapture } from '@/components/registration/PhotoCapture';
import { LoadingState } from '@/components/LoadingState';
import { ErrorState } from '@/components/ErrorState';
import { getAttendeeCookieClient } from '@/lib/cookies-client';

interface RegistrationPageProps {
  params: Promise<{ eventId: string }>;
}

export default function RegistrationPage({ params }: RegistrationPageProps) {
  const router = useRouter();
  const { eventId } = use(params);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [costumeTitle, setCostumeTitle] = useState('');
  const [selfie, setSelfie] = useState<File | null>(null);
  const [fullPhoto, setFullPhoto] = useState<File | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName || !costumeTitle || !selfie || !fullPhoto) {
      setError('Please fill in all fields and capture both photos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create/update attendee
      const attendeeResponse = await fetch('/api/attendee/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, displayName }),
      });

      if (!attendeeResponse.ok) {
        throw new Error('Failed to create attendee');
      }

      const { attendeeId } = await attendeeResponse.json();

      // Step 2: Upload registration
      const formData = new FormData();
      formData.append('eventId', eventId);
      formData.append('attendeeId', attendeeId);
      formData.append('costumeTitle', costumeTitle);
      formData.append('photoSelfie', selfie);
      formData.append('photoFull', fullPhoto);

      const registrationResponse = await fetch('/api/registration/upsert', {
        method: 'POST',
        body: formData,
      });

      if (!registrationResponse.ok) {
        const errorData = await registrationResponse.json();
        throw new Error(errorData.error || 'Failed to upload registration');
      }

      // Success!
      setSuccess(true);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 text-6xl">🎉</div>
            <CardTitle className="text-2xl">You&apos;re In!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Your costume registration is complete. When voting opens, come back to vote for your
              favorites!
            </p>
            <Button onClick={() => router.push(`/v/${eventId}`)} className="w-full">
              Go to Voting
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Register Your Costume 🎃</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit your photos to join the contest!
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Your Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={255}
                required
              />
            </div>

            {/* Costume Title Input */}
            <div className="space-y-2">
              <Label htmlFor="costumeTitle">Costume Title</Label>
              <Input
                id="costumeTitle"
                type="text"
                placeholder="e.g., Spooky Ghost"
                value={costumeTitle}
                onChange={(e) => setCostumeTitle(e.target.value)}
                maxLength={255}
                required
              />
            </div>

            {/* Selfie Photo */}
            <div className="space-y-2">
              <Label>Selfie Photo</Label>
              <PhotoCapture type="selfie" onCapture={setSelfie} value={selfie} />
            </div>

            {/* Full Body Photo */}
            <div className="space-y-2">
              <Label>Full Body Photo</Label>
              <PhotoCapture type="full" onCapture={setFullPhoto} value={fullPhoto} />
            </div>

            {/* Error Display */}
            {error && <ErrorState error={{ message: error }} variant="inline" />}

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <LoadingState variant="spinner" size="sm" /> : 'Submit Registration 🚀'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

