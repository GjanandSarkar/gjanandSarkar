/**
 * AWS S3 Client — Product Images & Assets
 * 
 * Env vars required:
 *   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   AWS_S3_BUCKET_NAME
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─── Singleton S3 Client ───────────────────────────────────────
const globalForS3 = globalThis as unknown as { _s3Client: S3Client | undefined };

function createS3Client(): S3Client {
  return new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export const s3 = globalForS3._s3Client ?? createS3Client();
if (process.env.NODE_ENV !== 'production') globalForS3._s3Client = s3;

const BUCKET = process.env.AWS_S3_BUCKET_NAME || 'dairydirect-assets';

// ─── Upload File ──────────────────────────────────────────────

/**
 * Upload a Buffer to S3 and return the public URL.
 * Used for product images uploaded by admin.
 */
export async function uploadFileToS3(params: {
  key: string;        // e.g. 'products/abc123.jpg'
  body: Buffer;
  contentType: string; // e.g. 'image/jpeg'
  isPublic?: boolean;
}): Promise<{ url: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType,
    ACL: params.isPublic !== false ? 'public-read' : 'private',
    CacheControl: 'max-age=31536000', // 1 year for images
  });

  await s3.send(command);

  const url = `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${params.key}`;
  return { url, key: params.key };
}

/**
 * Generate a pre-signed URL for direct browser upload (avoids routing file through server)
 * Use this in the frontend to upload images directly from the browser.
 * Expires in 5 minutes.
 */
export async function getPresignedUploadUrl(params: {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 300
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: params.expiresIn ?? 300 });
}

/**
 * Generate a pre-signed GET URL for private files (e.g., invoices)
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await s3.send(command);
}

/**
 * Generate a unique S3 key for a product image
 */
export function generateProductImageKey(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `products/${timestamp}-${random}.${ext}`;
}

/**
 * Get the public CloudFront URL for an S3 key
 * Use this when CloudFront distribution is configured
 */
export function getPublicUrl(key: string): string {
  const cfDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
  if (cfDomain) {
    return `https://${cfDomain}/${key}`;
  }
  return `https://${BUCKET}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
}
