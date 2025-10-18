import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAttendeeId } from '@/lib/cookies';
import { generateThumbnail } from '@/lib/image-server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
    const cookieAttendeeId = getAttendeeId(eventId);
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

    // Save files
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', eventId);
    await mkdir(uploadDir, { recursive: true });

    const registrationId = crypto.randomUUID();
    const selfieFilename = `${registrationId}_selfie.jpg`;
    const selfieThumbFilename = `${registrationId}_selfie_thumb.jpg`;
    const fullFilename = `${registrationId}_full.jpg`;
    const fullThumbFilename = `${registrationId}_full_thumb.jpg`;

    await Promise.all([
      writeFile(path.join(uploadDir, selfieFilename), selfieBuffer),
      writeFile(path.join(uploadDir, selfieThumbFilename), selfieThumbnail),
      writeFile(path.join(uploadDir, fullFilename), fullBuffer),
      writeFile(path.join(uploadDir, fullThumbFilename), fullThumbnail),
    ]);

    // Save to database
    const registration = await prisma.registration.create({
      data: {
        id: registrationId,
        eventId,
        attendeeId,
        costumeTitle,
        photoSelfieUrl: `/uploads/${eventId}/${selfieFilename}`,
        photoFullUrl: `/uploads/${eventId}/${fullFilename}`,
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

