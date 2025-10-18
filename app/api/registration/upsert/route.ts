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
    const photoSelfie = formData.get('photoSelfie') as File | null;
    const photoFull = formData.get('photoFull') as File | null;

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

    // Check if this is an update (existing registration)
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId,
        attendeeId,
      },
    });

    // For new registrations, both photos are required
    if (!existingRegistration && (!photoSelfie || !photoFull)) {
      return NextResponse.json(
        { success: false, error: 'Both photos required for new registration' },
        { status: 400 }
      );
    }

    // Validate file sizes if provided
    if (photoSelfie && photoSelfie.size > 6 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Selfie photo too large (max 6MB)' },
        { status: 413 }
      );
    }

    if (photoFull && photoFull.size > 6 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Full photo too large (max 6MB)' },
        { status: 413 }
      );
    }

    // Use existing registration ID if updating, otherwise create new
    const registrationId = existingRegistration?.id || crypto.randomUUID();
    
    // Start with existing photo URLs if this is an update
    let photoSelfieUrl = existingRegistration?.photoSelfieUrl || '';
    let photoFullUrl = existingRegistration?.photoFullUrl || '';

    // Detect if we're in a serverless environment (Vercel)
    const isServerless = process.env.VERCEL || process.env.BLOB_READ_WRITE_TOKEN;

    // Process new selfie photo if provided
    if (photoSelfie) {
      const selfieBuffer = Buffer.from(await photoSelfie.arrayBuffer());
      const selfieThumbnail = await generateThumbnail(selfieBuffer);
      const selfieFilename = `${registrationId}_selfie.jpg`;
      const selfieThumbFilename = `${registrationId}_selfie_thumb.jpg`;

      if (isServerless) {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required for file uploads in production');
        }

        const selfieBlob = await put(`${eventId}/${selfieFilename}`, selfieBuffer, { access: 'public' });
        await put(`${eventId}/${selfieThumbFilename}`, selfieThumbnail, { access: 'public' });
        photoSelfieUrl = selfieBlob.url;
      } else {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', eventId);
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, selfieFilename), selfieBuffer);
        await writeFile(path.join(uploadDir, selfieThumbFilename), selfieThumbnail);
        photoSelfieUrl = `/uploads/${eventId}/${selfieFilename}`;
      }
    }

    // Process new full photo if provided
    if (photoFull) {
      const fullBuffer = Buffer.from(await photoFull.arrayBuffer());
      const fullThumbnail = await generateThumbnail(fullBuffer);
      const fullFilename = `${registrationId}_full.jpg`;
      const fullThumbFilename = `${registrationId}_full_thumb.jpg`;

      if (isServerless) {
        if (!process.env.BLOB_READ_WRITE_TOKEN) {
          throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required for file uploads in production');
        }

        const fullBlob = await put(`${eventId}/${fullFilename}`, fullBuffer, { access: 'public' });
        await put(`${eventId}/${fullThumbFilename}`, fullThumbnail, { access: 'public' });
        photoFullUrl = fullBlob.url;
      } else {
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', eventId);
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, fullFilename), fullBuffer);
        await writeFile(path.join(uploadDir, fullThumbFilename), fullThumbnail);
        photoFullUrl = `/uploads/${eventId}/${fullFilename}`;
      }
    }

    // Save to database (upsert)
    const registration = await prisma.registration.upsert({
      where: {
        id: registrationId,
      },
      update: {
        costumeTitle,
        photoSelfieUrl,
        photoFullUrl,
      },
      create: {
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

