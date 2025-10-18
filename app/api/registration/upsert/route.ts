import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendeeId } from '@/lib/cookies-server';
import { generateThumbnail } from '@/lib/image-server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const eventId = formData.get('eventId') as string;
    const attendeeId = formData.get('attendeeId') as string;
    const costumeTitle = formData.get('costumeTitle') as string;
    const photoSelfie = formData.get('photoSelfie') as File;
    const photoFull = formData.get('photoFull') as File;

    // Validate inputs
    if (!eventId || !attendeeId || !costumeTitle) {
      return NextResponse.json(
        { success: false, error: 'MISSING_FIELDS' },
        { status: 400 }
      );
    }

    // Validate cookie matches
    const cookieAttendeeId = await getAttendeeId(eventId);
    if (cookieAttendeeId !== attendeeId) {
      return NextResponse.json(
        { success: false, error: 'INVALID_ATTENDEE' },
        { status: 401 }
      );
    }

    // Validate files
    if (!photoSelfie || !photoFull) {
      return NextResponse.json(
        { success: false, error: 'Both photos required' },
        { status: 400 }
      );
    }

    if (photoSelfie.size > 6 * 1024 * 1024 || photoFull.size > 6 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'FILE_TOO_LARGE' },
        { status: 413 }
      );
    }

    // Process images
    const selfieBuffer = Buffer.from(await photoSelfie.arrayBuffer());
    const fullBuffer = Buffer.from(await photoFull.arrayBuffer());

    // Generate thumbnails
    const selfieThumbnail = await generateThumbnail(selfieBuffer);
    const fullThumbnail = await generateThumbnail(fullBuffer);

    const registrationId = crypto.randomUUID();
    const selfieFilename = `${registrationId}_selfie.jpg`;
    const selfieThumbFilename = `${registrationId}_selfie_thumb.jpg`;
    const fullFilename = `${registrationId}_full.jpg`;
    const fullThumbFilename = `${registrationId}_full_thumb.jpg`;

    let photoSelfieUrl: string;
    let photoFullUrl: string;

    // Detect if we're in a serverless environment (Vercel)
    const isServerless = process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN;

    if (isServerless) {
      // Use Vercel Blob Storage for serverless environments
      if (!process.env.BLOB_READ_WRITE_TOKEN) {
        throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required for file uploads in production');
      }

      const [selfieBlob, selfieThumbBlob, fullBlob, fullThumbBlob] = await Promise.all([
        put(`${eventId}/${selfieFilename}`, selfieBuffer, { access: 'public' }),
        put(`${eventId}/${selfieThumbFilename}`, selfieThumbnail, { access: 'public' }),
        put(`${eventId}/${fullFilename}`, fullBuffer, { access: 'public' }),
        put(`${eventId}/${fullThumbFilename}`, fullThumbnail, { access: 'public' }),
      ]);

      photoSelfieUrl = selfieBlob.url;
      photoFullUrl = fullBlob.url;
    } else {
      // Use local filesystem for development
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', eventId);
      await mkdir(uploadDir, { recursive: true });

      await Promise.all([
        writeFile(path.join(uploadDir, selfieFilename), selfieBuffer),
        writeFile(path.join(uploadDir, selfieThumbFilename), selfieThumbnail),
        writeFile(path.join(uploadDir, fullFilename), fullBuffer),
        writeFile(path.join(uploadDir, fullThumbFilename), fullThumbnail),
      ]);

      photoSelfieUrl = `/uploads/${eventId}/${selfieFilename}`;
      photoFullUrl = `/uploads/${eventId}/${fullFilename}`;
    }

    // Save to database
    const registration = await prisma.registration.create({
      data: {
        id: registrationId,
        eventId,
        attendeeId,
        costumeTitle,
        photoSelfieUrl,
        photoFullUrl,
        isApproved: true,
      },
    });

    return NextResponse.json({
      success: true,
      registrationId: registration.id,
      photoSelfieUrl: registration.photoSelfieUrl,
      photoFullUrl: registration.photoFullUrl,
    });
  } catch (error) {
    console.error('Registration upload error:', error);
    return NextResponse.json(
      { success: false, error: 'UNKNOWN_ERROR' },
      { status: 500 }
    );
  }
}

