import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ValidationError } from '../errors/AppError';

// ─── Memory Storage ─────────────────────────────────────────────
const storage = multer.memoryStorage();

// ─── File Filter (Allowed image MIME types) ──────────────────────
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        `Invalid file format: ${file.mimetype}. Allowed formats: JPEG, PNG, WebP, GIF, SVG, AVIF.`
      )
    );
  }
};

// ─── Multer Instance ────────────────────────────────────────────
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10,
  },
});

export const uploadSingleImage = (fieldName: string = 'image') => upload.single(fieldName);
export const uploadMultipleImages = (fieldName: string = 'images', maxCount: number = 5) =>
  upload.array(fieldName, maxCount);
