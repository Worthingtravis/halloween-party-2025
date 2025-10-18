import sharp from 'sharp';

/**
 * SERVER-SIDE: Generate thumbnail with Sharp
 */
export async function generateThumbnail(
  buffer: Buffer,
  width: number = 400
): Promise<Buffer> {
  return await sharp(buffer)
    .resize(width, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

