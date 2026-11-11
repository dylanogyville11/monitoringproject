import multer from 'multer';
import { HttpError } from './errorHandler';

/** Allowed MIME types for document uploads */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
]);

/** Maximum file size: 25 MB */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Multer configuration using in-memory storage.
 * Files are kept as Buffer objects in req.file / req.files.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new HttpError(
          400,
          'Tipe file tidak diizinkan. Hanya PDF, Word, Excel, JPEG, dan PNG yang diterima.',
        ),
      );
    }
  },
});
