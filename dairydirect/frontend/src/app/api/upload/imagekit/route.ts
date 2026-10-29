/**
 * POST /api/upload/imagekit
 * Authenticated image upload to ImageKit.
 *
 * Security controls:
 * - Authentication required (JWT or Supabase bearer)
 * - File type restricted to images only (MIME sniffing + extension check)
 * - File size capped at 10 MB
 * - folder parameter restricted to an explicit allowlist (prevents path traversal)
 */

import { NextResponse } from 'next/server';
import ImageKit from '@imagekit/nodejs';
import { getAuthUser } from '@/lib/api/auth-middleware';
import { parseUploadPayload, isParseFailure } from '@/lib/images/payload';

// Allowed upload folders (relative to /dairydirect/).
// Client can request any of these; anything else is rejected.
const ALLOWED_FOLDERS = new Set([
  'profiles',
  'products',
  'returns_evidence',
  'seller_logos',
  'seller_banners',
  'categories',
  'ads',
  /* These four are offered by the ImageKitFolder type in lib/api/imagekit.ts,
     so the client could legitimately request them while the server rejected
     them with a 400. The type and the allowlist now agree. */
  'banners',
  'quality-reports',
  'claims',
  'sellers',
]);

// Maximum upload size: 10 MB (in bytes)
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // ─── Authentication ───────────────────────────────────────────────────────
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let filePayload: string | null = null;
    let fileName: string | undefined;
    let requestedFolder = 'profiles'; // safe default

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const fileEntry = formData.get('file');
      fileName = (formData.get('fileName') as string) || undefined;
      const folderParam = formData.get('folder');
      if (folderParam) requestedFolder = String(folderParam).trim().replace(/^\/+/, '');

      if (fileEntry instanceof File) {
        const arrayBuffer = await fileEntry.arrayBuffer();
        filePayload = Buffer.from(arrayBuffer).toString('base64');
        if (!fileName) fileName = fileEntry.name;
      } else if (typeof fileEntry === 'string') {
        filePayload = fileEntry;
      }
    } else {
      const body = await request.json().catch(() => null);
      if (body) {
        filePayload = body.file || null;
        fileName = body.fileName;
        if (body.folder) requestedFolder = String(body.folder).trim().replace(/^\/+/, '');
      }
    }

    if (!filePayload) {
      return NextResponse.json({ error: 'Image file content is required.' }, { status: 400 });
    }

    /* Every caller in this app uploads via FileReader.readAsDataURL, which
       produces "data:image/png;base64,AAAA...". The previous sniffer read
       magic bytes out of the first 24 CHARACTERS of that string, so it was
       decoding the ASCII prefix rather than the image, never matched a
       signature, and rejected every upload with 415. It also handed the
       prefixed string to ImageKit, which is not valid base64.

       parseUploadPayload strips any data: prefix, enforces the size cap,
       and identifies the type from the decoded bytes. */
    const parsed = parseUploadPayload(filePayload, MAX_FILE_SIZE_BYTES);
    if (isParseFailure(parsed)) {
      return NextResponse.json({ error: parsed.error }, { status: parsed.status });
    }
    filePayload = parsed.base64;

    // ─── Validate folder against allowlist ────────────────────────────────────
    // Strip path separators and leading /dairydirect/ prefix if the caller included it.
    const normalizedFolder = requestedFolder.replace(/^dairydirect\//, '').replace(/^\//, '').split('/')[0];
    if (!ALLOWED_FOLDERS.has(normalizedFolder)) {
      return NextResponse.json(
        { error: `Upload folder '${requestedFolder}' is not permitted. Allowed: ${Array.from(ALLOWED_FOLDERS).join(', ')}.` },
        { status: 400 }
      );
    }

    const targetFolder = `/dairydirect/${normalizedFolder}`;

    // ─── Sanitize filename ────────────────────────────────────────────────────
    const safeFileName = fileName
      ? fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 128)
      : `upload_${auth.userId}_${Date.now()}.png`;

    // ─── ImageKit upload ──────────────────────────────────────────────────────
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (!privateKey) {
      console.error('[ImageKit] IMAGEKIT_PRIVATE_KEY is not set.');
      return NextResponse.json({ error: 'Upload service is not configured.' }, { status: 500 });
    }

    const imagekit = new ImageKit({ privateKey });

    const uploadResponse = await imagekit.files.upload({
      file: filePayload,
      fileName: safeFileName,
      folder: targetFolder,
      useUniqueFileName: true,
    });

    if (!uploadResponse?.url) {
      return NextResponse.json({ error: 'Failed to obtain upload URL from ImageKit.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
      mime: parsed.mime,
      sizeBytes: parsed.sizeBytes,
    });

  } catch (error: any) {
    console.error('[ImageKit Upload Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image.' },
      { status: 500 }
    );
  }
}
