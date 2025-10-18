# Storage Migration Summary

## Overview
The app has been updated to support both local filesystem storage (development) and Vercel Blob Storage (production/serverless) for costume images.

## Changes Made

### 1. Package Dependencies
- ✅ Added `@vercel/blob` package for cloud storage

### 2. Upload Endpoint (`app/api/registration/upsert/route.ts`)
- ✅ Hybrid storage implementation:
  - **Local Development**: Saves to `public/uploads/`
  - **Production/Serverless**: Uploads to Vercel Blob Storage
- ✅ Automatic environment detection via `VERCEL` or `BLOB_READ_WRITE_TOKEN` env vars
- ✅ Generates and stores thumbnails for both storage methods

### 3. Next.js Configuration (`next.config.ts`)
- ✅ Added remote image pattern for Vercel Blob Storage domains
- ✅ Pattern: `*.public.blob.vercel-storage.com`
- ✅ Maintains existing local path support

### 4. API Endpoints (No Changes Needed)
All endpoints correctly handle both URL types:

- ✅ `/api/registration/list` - Returns URLs from database (works with both local and remote)
- ✅ `/api/events/list` - No image handling
- ✅ `/api/vote/*` - No image handling
- ✅ `/api/attendee/upsert` - No image handling
- ✅ `/api/events/[eventId]/status` - No image handling

### 5. Frontend Components (No Changes Needed)
All components use Next.js Image component which handles both URL types:

- ✅ `CostumeCard.tsx` - Uses Next.js Image with both local and remote URLs
- ✅ `app/v/[eventId]/page.tsx` - Voting page renders images correctly
- ✅ `app/results/[eventId]/page.tsx` - Results page renders images correctly
- ✅ `app/r/[eventId]/page.tsx` - Registration form uploads via FormData

## How It Works

### Image Upload Flow

1. **User submits registration** with photos via FormData
2. **Server receives files** at `/api/registration/upsert`
3. **Server detects environment**:
   - If `VERCEL` or `BLOB_READ_WRITE_TOKEN` exists → Use Vercel Blob Storage
   - Otherwise → Use local filesystem
4. **Server uploads files**:
   - Original selfie and full photos
   - Thumbnail versions (400px width)
5. **Server stores URLs** in database:
   - Local: `/uploads/{eventId}/{filename}`
   - Remote: `https://{account}.public.blob.vercel-storage.com/{eventId}/{filename}`
6. **Frontend fetches registrations** and displays images using stored URLs
7. **Next.js Image component** optimizes and serves images from either source

### Database
- No schema changes needed
- `photoSelfieUrl` and `photoFullUrl` fields store complete URLs
- Works with both local paths and remote URLs

## Environment Variables

### Development (Local)
No special configuration needed. Files save to `public/uploads/`

### Production (Vercel)
Required environment variable:
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

Get this from: Vercel Dashboard → Storage → Blob → Create Store

## Migration Path

### Existing Local Data
If you have existing images in `public/uploads/`:
- They continue to work in development
- For production, you'll need to migrate them to Blob Storage or keep them in a CDN

### New Uploads
- Development: Saves locally
- Production: Saves to Vercel Blob Storage automatically

## Testing

### Local Development
1. Run `pnpm dev`
2. Upload a registration
3. Verify files appear in `public/uploads/{eventId}/`
4. Verify images display correctly in voting/results pages

### Production (Vercel)
1. Set `BLOB_READ_WRITE_TOKEN` environment variable
2. Deploy to Vercel
3. Upload a registration
4. Verify files appear in Vercel Blob Storage dashboard
5. Verify images display correctly with blob storage URLs

## Benefits

✅ **Serverless Compatible** - No filesystem dependencies in production
✅ **Development Friendly** - Local files for easy debugging
✅ **Automatic Detection** - No code changes between environments
✅ **Scalable** - Vercel Blob Storage handles any traffic
✅ **Cost Effective** - Only pay for storage used
✅ **Fast** - CDN-backed blob storage for quick image delivery

## Troubleshooting

### Error: "ENOENT: no such file or directory, mkdir '/var/task/public'"
**Solution**: Ensure `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables

### Images not loading in production
**Solution**: Check Next.js config includes blob storage domain pattern

### Upload fails with "BLOB_READ_WRITE_TOKEN required"
**Solution**: Add token from Vercel Blob Storage dashboard

