# Deployment Guide

## Environment Variables

### Required for Production (Vercel/Serverless)

#### `BLOB_READ_WRITE_TOKEN`
Required for file uploads in serverless environments. The app automatically detects serverless deployment and uses Vercel Blob Storage instead of local filesystem.

**How to get it:**
1. Go to your Vercel Dashboard
2. Navigate to Storage > Blob
3. Click "Create Store" if you haven't already
4. Copy the `BLOB_READ_WRITE_TOKEN` from the connection details
5. Add it to your environment variables in Vercel

#### `DATABASE_URL`
Your PostgreSQL database connection string.

## Storage Strategy

The app uses a hybrid storage approach:

- **Development (Local)**: Files are saved to `public/uploads/` directory
- **Production (Serverless)**: Files are uploaded to Vercel Blob Storage

This is automatically detected based on:
- `VERCEL` environment variable (automatically set by Vercel)
- `BLOB_READ_WRITE_TOKEN` environment variable

## Local Development

For local development, no special configuration is needed. Files will be saved to the local filesystem in `public/uploads/`.

## Vercel Deployment

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add the following environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `BLOB_READ_WRITE_TOKEN` - From Vercel Blob Storage
4. Deploy

## Image Configuration

The app is configured to serve images from:
- Local filesystem: `/uploads/...`
- Vercel Blob Storage: `https://*.public.blob.vercel-storage.com/**`

Both sources are configured in `next.config.ts`.

