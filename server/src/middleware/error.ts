import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';

export function errorHandler(
  err: Error & { status?: number; code?: string },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error(err.stack);

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File too large. Maximum size is 10MB.', code: 'FILE_TOO_LARGE' });
      return;
    }
    res.status(400).json({ error: err.message, code: 'UPLOAD_ERROR' });
    return;
  }

  // File type validation error from multer fileFilter
  if (err.message?.startsWith('File type')) {
    res.status(415).json({ error: err.message, code: 'UNSUPPORTED_FILE_TYPE' });
    return;
  }

  const status = err.status ?? 500;
  console.error(err.message);
  res.status(status).json({ error: status < 500 ? err.message : 'Internal server error' });
}
