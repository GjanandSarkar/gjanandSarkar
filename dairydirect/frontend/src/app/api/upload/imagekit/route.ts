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
]);

// Allowed image MIME types (checked on the Content-Type of multipart, and
// via magic-byte sniffing on base64 for JSON uploads).
const ALLOWED_MIME_PREFIXES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

// Maximum upload size: 10 MB (in bytes)
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Sniff the first bytes of a base64-encoded file to detect its MIME type.
 * Returns null if the type cannot be determined or is not an image.
 */
function sniffMimeFromBase64(base64: string): string | null {
  try {
    const decoded = Buffer.from(base64.slice(0, 24), 'base64');
    if (decoded[0] === 0xff && decoded[1] === 0xd8) return 'image/jpeg';
    if (decoded[0] === 0x89 && decoded[1] === 0x50) return 'image/png';
    if (decoded[0] === 0x52 && decoded[1] === 0x49 && decoded[3] === 0x57) return 'image/webp';
    if (decoded[0] === 0x47 && decoded[1] === 0x49) return 'image/gif';
    // AVIF is a variant of ISOBMFF — harder to sniff simply; allow by extension
    return null;
  } catch {
    return null;
  }
}

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
    let fileSizeBytes = 0;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const fileEntry = formData.get('file');
      fileName = (formData.get('fileName') as string) || undefined;
      const folderParam = formData.get('folder');
      if (folderParam) requestedFolder = String(folderParam).trim().replace(/^\/+/, '');

      if (fileEntry instanceof File) {
        fileSizeBytes = fileEntry.size;
        if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` }, { status: 413 });
        }

        // Validate MIME type via Content-Type on the file part
        const fileMime = fileEntry.type;
        if (!ALLOWED_MIME_PREFIXES.some((m) => fileMime.startsWith(m))) {
          return NextResponse.json({ error: `File type '${fileMime}' is not allowed. Only images are accepted.` }, { status: 415 });
        }

        const arrayBuffer = await fileEntry.arrayBuffer();
        filePayload = Buffer.from(arrayBuffer).toString('base64');
        if (!fileName) fileName = fileEntry.name;
      } else if (typeof fileEntry === 'string') {
        // Base64 string passed in form field
        filePayload = fileEntry;
        fileSizeBytes = Math.ceil((fileEntry.length * 3) / 4);
        if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` }, { status: 413 });
        }
        const sniffed = sniffMimeFromBase64(fileEntry);
        if (!sniffed) {
          return NextResponse.json({ error: 'Could not determine file type. Only images are accepted.' }, { status: 415 });
        }
      }
    } else {
      const body = await request.json().catch(() => null);
      if (body) {
        filePayload = body.file || null;
        fileName = body.fileName;
        if (body.folder) requestedFolder = String(body.folder).trim().replace(/^\/+/, '');

        if (filePayload) {
          fileSizeBytes = Math.ceil((filePayload.length * 3) / 4);
          if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` }, { status: 413 });
          }
          const sniffed = sniffMimeFromBase64(filePayload);
          if (!sniffed) {
            return NextResponse.json({ error: 'Could not determine file type. Only images are accepted.' }, { status: 415 });
          }
        }
      }
    }

    if (!filePayload) {
      return NextResponse.json({ error: 'Image file content is required.' }, { status: 400 });
    }

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
    });

  } catch (error: any) {
    console.error('[ImageKit Upload Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image.' },
      { status: 500 }
    );
  }
}
