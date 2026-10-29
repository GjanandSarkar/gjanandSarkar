/**
 * Upload payload parsing for /api/upload/imagekit.
 *
 * Extracted from the route so it can be unit tested without standing up a
 * request: the bug this file fixes was a pure string-handling mistake that
 * no integration test would have caught any faster.
 */

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const;

export interface ParsedUpload {
  /** Base64 WITHOUT any data: prefix — what ImageKit actually wants. */
  base64: string;
  /** MIME type we are willing to vouch for. */
  mime: string;
  /** Decoded byte length, for the size cap. */
  sizeBytes: number;
}

export interface ParseFailure {
  error: string;
  status: 400 | 413 | 415;
}

/** `data:image/png;base64,AAAA` -> parts. Returns null when not a data URI. */
function splitDataUri(input: string): { mime: string; base64: string } | null {
  const match = /^data:([a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]{0,126}\/[a-zA-Z0-9][a-zA-Z0-9!#$&^_.+-]{0,126})?;base64,([\s\S]*)$/.exec(
    input.trim()
  );
  if (!match) return null;
  return { mime: (match[1] || '').toLowerCase(), base64: match[2] };
}

/**
 * Identify an image from its leading bytes.
 *
 * Magic numbers are checked on the DECODED payload, never on the base64
 * text. Decoding the first 24 characters of a data URI yields the bytes of
 * the ASCII prefix, which is exactly how every upload came to be rejected
 * as "could not determine file type".
 */
export function sniffMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';

  // RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  // ISOBMFF: ....ftyp<brand>. AVIF and HEIC share the container, so the
  // brand is what distinguishes them.
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }

  return null;
}

/**
 * Normalise whatever the client sent into clean base64 plus a trusted MIME.
 *
 * Accepts a bare base64 string or a data URI, because the three upload
 * call sites in this app all use FileReader.readAsDataURL and therefore
 * always send the latter.
 */
export function parseUploadPayload(
  input: string,
  maxBytes: number
): ParsedUpload | ParseFailure {
  if (!input || typeof input !== 'string') {
    return { error: 'Image file content is required.', status: 400 };
  }

  const dataUri = splitDataUri(input);
  const base64 = (dataUri ? dataUri.base64 : input).replace(/\s/g, '');

  if (!base64) {
    return { error: 'Image file content is required.', status: 400 };
  }

  /* Check the size BEFORE decoding. Decoding first would mean allocating the
     full buffer for a payload we are about to reject, which is a trivial way
     to push memory around on a serverless instance. */
  const approxBytes = Math.ceil((base64.length * 3) / 4);
  if (approxBytes > maxBytes) {
    return {
      error: `File too large. Maximum size is ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
      status: 413,
    };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, 'base64');
  } catch {
    return { error: 'Image data is not valid base64.', status: 400 };
  }

  if (buffer.length === 0) {
    return { error: 'Image file content is required.', status: 400 };
  }
  if (buffer.length > maxBytes) {
    return {
      error: `File too large. Maximum size is ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
      status: 413,
    };
  }

  /* The bytes are the ONLY evidence used. An earlier version fell back to
     the client-declared type when sniffing failed, which meant anything at
     all - a PHP script, an HTML page - could be uploaded simply by labelling
     it data:image/png. A caller controls that label completely, so it can
     never be the basis for accepting a file. The unit test for this case is
     what caught it. */
  const mime = sniffMime(buffer);

  if (!mime) {
    return {
      error: 'Could not determine file type. Only images are accepted.',
      status: 415,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(mime as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      error: `File type '${mime}' is not allowed. Only images are accepted.`,
      status: 415,
    };
  }

  return { base64, mime, sizeBytes: buffer.length };
}

export function isParseFailure(
  result: ParsedUpload | ParseFailure
): result is ParseFailure {
  return (result as ParseFailure).error !== undefined;
}
