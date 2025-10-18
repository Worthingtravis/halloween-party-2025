import imageCompression from 'browser-image-compression';

/**
 * CLIENT-SIDE: Compress image before upload
 */
export async function compressImage(file: File): Promise<Blob> {
  return await imageCompression(file, {
    maxWidthOrHeight: 1080,
    useWebWorker: true,
    quality: 0.7,
  });
}

/**
 * Validate image file (MIME, size)
 */
export async function validateImageFile(
  file: File,
  constraints: { maxSizeMB: number }
): Promise<{ valid: boolean; error?: string }> {
  // Check MIME type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return { valid: false, error: 'Please upload a JPG, PNG, or WEBP image.' };
  }

  // Check size
  if (file.size > constraints.maxSizeMB * 1024 * 1024) {
    return {
      valid: false,
      error: `Image is too large. Please use a photo under ${constraints.maxSizeMB}MB.`,
    };
  }

  return { valid: true };
}

/**
 * Calculate file size reduction percentage
 */
export function getCompressionRatio(original: File, compressed: Blob): number {
  return Math.round((1 - compressed.size / original.size) * 100);
}

