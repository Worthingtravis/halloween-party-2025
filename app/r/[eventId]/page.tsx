'use client';

import React, { useState, use, useEffect } from 'react';
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

interface ExistingRegistration {
  id: string;
  costumeTitle: string;
  photoSelfieUrl: string;
  photoFullUrl: string;
  isApproved: boolean;
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
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingRegistration, setExistingRegistration] = useState<ExistingRegistration | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showEditChoice, setShowEditChoice] = useState(false);

  // Check for existing registration on mount
  useEffect(() => {
    const checkExistingRegistration = async () => {
      try {
        const attendeeId = getAttendeeCookieClient(eventId);
        
        if (!attendeeId) {
          setCheckingExisting(false);
          return;
        }

        const response = await fetch(`/api/registration/me?eventId=${eventId}`);
        
        if (!response.ok) {
          setCheckingExisting(false);
          return;
        }

        const data = await response.json();
        
        if (data.success && data.hasRegistration) {
          setExistingRegistration(data.registration);
          setDisplayName(data.displayName || '');
          setCostumeTitle(data.registration.costumeTitle);
          setShowEditChoice(true); // Show choice screen first
        }
      } catch (err) {
        console.error('Error checking existing registration:', err);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExistingRegistration();
  }, [eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For new registrations, require all fields
    // For editing, photos are optional (can keep existing photos)
    if (!displayName || !costumeTitle) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isEditing && (!selfie || !fullPhoto)) {
      setError('Please capture both photos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get existing attendee ID if available
      const existingAttendeeId = getAttendeeCookieClient(eventId);

      // Step 1: Create/update attendee
      const attendeeResponse = await fetch('/api/attendee/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId, 
          displayName,
          ...(existingAttendeeId && { attendeeId: existingAttendeeId })
        }),
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
      
      // Only append photos if they're provided (new photos in edit mode)
      if (selfie) {
        formData.append('photoSelfie', selfie);
      }
      if (fullPhoto) {
        formData.append('photoFull', fullPhoto);
      }

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

  if (checkingExisting) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <LoadingState variant="spinner" size="lg" message="Loading..." />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show choice screen if user is already registered
  if (showEditChoice && existingRegistration) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardHeader>
            <div className="mx-auto mb-4 text-6xl">✅</div>
            <CardTitle className="text-2xl text-center">You're Already Registered!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">{costumeTitle}</p>
                <p className="text-sm text-muted-foreground mt-1">{displayName}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your costume is already registered for this event. What would you like to do?
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => router.push(`/v/${eventId}`)} 
                className="w-full"
                size="lg"
              >
                Go to Voting Page
              </Button>
              <Button 
                onClick={() => {
                  setShowEditChoice(false);
                  setIsEditing(true);
                }} 
                variant="outline"
                className="w-full"
                size="lg"
              >
                Edit My Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4 text-6xl">🎉</div>
            <CardTitle className="text-2xl">{isEditing ? 'Updated!' : "You're In!"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {isEditing 
                ? 'Your costume registration has been updated successfully!'
                : 'Your costume registration is complete. When voting opens, come back to vote for your favorites!'
              }
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
          <CardTitle className="text-2xl">
            {isEditing ? 'Edit Your Costume 🎨' : 'Register Your Costume 🎃'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isEditing 
              ? 'Update your registration details. Photos are optional - leave blank to keep existing.'
              : 'Submit your photos to join the contest!'
            }
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
              <Label>Selfie Photo {isEditing && '(optional)'}</Label>
              {isEditing && existingRegistration && !selfie && (
                <div className="mb-2 p-2 border rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">Current photo:</p>
                  <img 
                    src={existingRegistration.photoSelfieUrl} 
                    alt="Current selfie" 
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
              <PhotoCapture type="selfie" onCapture={setSelfie} value={selfie} />
            </div>

            {/* Full Body Photo */}
            <div className="space-y-2">
              <Label>Full Body Photo {isEditing && '(optional)'}</Label>
              {isEditing && existingRegistration && !fullPhoto && (
                <div className="mb-2 p-2 border rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-2">Current photo:</p>
                  <img 
                    src={existingRegistration.photoFullUrl} 
                    alt="Current full photo" 
                    className="w-full h-auto rounded"
                  />
                </div>
              )}
              <PhotoCapture type="full" onCapture={setFullPhoto} value={fullPhoto} />
            </div>

            {/* Error Display */}
            {error && <ErrorState error={{ message: error }} variant="inline" />}

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <LoadingState variant="spinner" size="sm" /> : (isEditing ? 'Update Registration 🎨' : 'Submit Registration 🚀')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

