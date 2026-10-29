import { describe, it, expect } from 'vitest';

import {
  parseUploadPayload,
  isParseFailure,
  sniffMime,
} from '@/lib/images/payload';

const MAX = 10 * 1024 * 1024;

/** Minimal but structurally valid image headers. */
const JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
  Buffer.from('JFIF\0'),
  Buffer.alloc(16),
]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(16),
]);
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(16)]);
const WEBP = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.alloc(16),
]);
const AVIF = Buffer.concat([
  Buffer.from([0x00, 0x00, 0x00, 0x20]),
  Buffer.from('ftyp'),
  Buffer.from('avif'),
  Buffer.alloc(16),
]);

const dataUri = (mime: string, buf: Buffer) =>
  `data:${mime};base64,${buf.toString('base64')}`;

describe('sniffMime', () => {
  it.each([
    ['jpeg', JPEG, 'image/jpeg'],
    ['png', PNG, 'image/png'],
    ['gif', GIF, 'image/gif'],
    ['webp', WEBP, 'image/webp'],
    ['avif', AVIF, 'image/avif'],
  ])('identifies %s from its magic bytes', (_label, buf, expected) => {
    expect(sniffMime(buf as Buffer)).toBe(expected);
  });

  it('returns null for data that is not an image', () => {
    expect(sniffMime(Buffer.from('this is plain text, not an image at all'))).toBeNull();
  });
});

describe('parseUploadPayload', () => {
  /* The regression. Every upload surface in the app uses
     FileReader.readAsDataURL, so a data URI is the NORMAL input, not an
     edge case. The old route sniffed magic bytes out of the first 24
     characters of that string, decoded the ASCII "data:image/jpeg;base64,"
     prefix instead of the image, and returned 415 for every single upload. */
  it('accepts a data URI, which is what every client actually sends', () => {
    const result = parseUploadPayload(dataUri('image/jpeg', JPEG), MAX);
    expect(isParseFailure(result)).toBe(false);
    if (isParseFailure(result)) return;
    expect(result.mime).toBe('image/jpeg');
  });

  it('strips the data: prefix, because ImageKit rejects it as invalid base64', () => {
    const result = parseUploadPayload(dataUri('image/png', PNG), MAX);
    if (isParseFailure(result)) throw new Error('expected success');
    expect(result.base64).toBe(PNG.toString('base64'));
    expect(result.base64.startsWith('data:')).toBe(false);
  });

  it('still accepts bare base64 with no prefix', () => {
    const result = parseUploadPayload(PNG.toString('base64'), MAX);
    if (isParseFailure(result)) throw new Error('expected success');
    expect(result.mime).toBe('image/png');
  });

  it('reports the true decoded size, not the base64 length', () => {
    const result = parseUploadPayload(dataUri('image/png', PNG), MAX);
    if (isParseFailure(result)) throw new Error('expected success');
    expect(result.sizeBytes).toBe(PNG.length);
  });

  it('trusts the bytes over a lying declared type', () => {
    // Claims PNG, actually JPEG. The real type must win.
    const result = parseUploadPayload(dataUri('image/png', JPEG), MAX);
    if (isParseFailure(result)) throw new Error('expected success');
    expect(result.mime).toBe('image/jpeg');
  });

  it('rejects a non-image disguised as an image', () => {
    const evil = `data:image/png;base64,${Buffer.from('<?php echo 1; ?>').toString('base64')}`;
    const result = parseUploadPayload(evil, MAX);
    expect(isParseFailure(result)).toBe(true);
    if (!isParseFailure(result)) return;
    expect(result.status).toBe(415);
  });

  it('rejects an oversized file with 413', () => {
    const result = parseUploadPayload(dataUri('image/png', PNG), 8);
    expect(isParseFailure(result)).toBe(true);
    if (!isParseFailure(result)) return;
    expect(result.status).toBe(413);
  });

  it('rejects empty content with 400', () => {
    const result = parseUploadPayload('', MAX);
    expect(isParseFailure(result)).toBe(true);
    if (!isParseFailure(result)) return;
    expect(result.status).toBe(400);
  });

  it('tolerates whitespace and newlines inside the base64', () => {
    const chunked = PNG.toString('base64').match(/.{1,8}/g)!.join('\n');
    const result = parseUploadPayload(`data:image/png;base64,${chunked}`, MAX);
    expect(isParseFailure(result)).toBe(false);
  });
});
