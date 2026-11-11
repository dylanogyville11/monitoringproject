import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { errorResponse } from '../utils/responseHelper';

/**
 * Error dengan HTTP status code eksplisit.
 */
export class HttpError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Global error handler. Wajib didaftarkan SETELAH seluruh route di app.ts.
 */
export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    errorResponse(res, fieldErrors[0]?.message ?? 'Validasi gagal.', 400, fieldErrors);
    return;
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorResponse(res, 'Ukuran file terlalu besar. Maksimum 25 MB.', 400);
      return;
    }
    errorResponse(res, `Upload error: ${err.message}`, 400);
    return;
  }

  if (err instanceof HttpError) {
    errorResponse(res, err.message, err.statusCode);
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    errorResponse(res, 'Format JSON tidak valid.', 400);
    return;
  }

  if (err instanceof Error) {
    console.error('[ERROR]', err.stack ?? err.message);
    const message =
      process.env.NODE_ENV === 'production' ? 'Terjadi kesalahan pada server.' : err.message;
    errorResponse(res, message, 500);
    return;
  }

  console.error('[ERROR] Unknown error:', err);
  errorResponse(res, 'Terjadi kesalahan pada server.', 500);
}
