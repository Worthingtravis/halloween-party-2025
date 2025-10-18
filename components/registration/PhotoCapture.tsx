'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/LoadingState';
import { compressImage, validateImageFile, getCompressionRatio } from '@/lib/image-utils';

interface PhotoCaptureProps {
  type: 'selfie' | 'full';
  onCapture: (file: File) => void;
  value?: File | null;
}

/**
 * PhotoCapture - Camera/file input with compression
 * 
 * Uses HTML5 capture attribute for native camera access
 * Falls back to file input if camera not available
 * 
 * @example
 * ```tsx
 * <PhotoCapture 
 *   type="selfie" 
 *   onCapture={(file) => setSelfie(file)} 
 * />
 * ```
 */
export function PhotoCapture({ type, onCapture, value }: PhotoCaptureProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setCompressionInfo(null);

    try {
      // 1. Validate
      const validation = await validateImageFile(file, { maxSizeMB: 6 });

      if (!validation.valid) {
        setError(validation.error!);
        setLoading(false);
        return;
      }

      // 2. Compress
      const compressed = await compressImage(file);
      const compressedFile = new File([compressed], file.name, {
        type: 'image/jpeg',
      });

      // 3. Calculate compression ratio
      const ratio = getCompressionRatio(file, compressed);
      setCompressionInfo(`Compressed by ${ratio}%`);

      // 4. Preview
      const previewUrl = URL.createObjectURL(compressedFile);
      setPreview(previewUrl);

      // 5. Callback
      onCapture(compressedFile);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    setError(null);
    setCompressionInfo(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const cameraType = type === 'selfie' ? 'user' : 'environment';
  const label = type === 'selfie' ? 'Selfie (Front Camera)' : 'Full Body Photo (Back Camera)';

  return (
    <div className="space-y-4">
      {/* Hidden file input with camera capture */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={cameraType}
        onChange={handleFileSelect}
        className="hidden"
        aria-label={`Capture ${type} photo`}
      />

      {preview && !loading ? (
        /* Preview State */
        <div className="space-y-3">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border">
            <Image
              src={preview}
              alt={`${type} preview`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>
          {compressionInfo && (
            <p className="text-xs text-center text-muted-foreground">{compressionInfo}</p>
          )}
          <Button onClick={handleRetake} variant="outline" className="w-full">
            Retake Photo
          </Button>
        </div>
      ) : loading ? (
        /* Loading State */
        <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border">
          <LoadingState variant="spinner" size="md" message="Processing photo..." />
        </div>
      ) : (
        /* Capture State */
        <div className="space-y-3">
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full"
            size="lg"
          >
            📸 Take {label}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Camera will open automatically • Or choose from gallery
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
    </div>
  );
}

