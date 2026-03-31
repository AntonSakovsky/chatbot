export type ApiError = Error & { status?: number; code?: string };

export function getErrorMessage(err: unknown): string {
  const e = err as ApiError;

  switch (e.code) {
    case 'LIMIT_REACHED':
      return "You've used all 3 free questions. Sign in to continue chatting.";
    case 'FILE_TOO_LARGE':
      return 'File too large. Maximum size is 10MB.';
    case 'UNSUPPORTED_FILE_TYPE':
      return 'File type not supported. Use images, PDF, DOCX, or plain text.';
    case 'UPLOAD_ERROR':
      return 'Upload failed. Please try again.';
    case 'TOKEN_EXPIRED':
      return 'Your session expired. Please sign in again.';
  }

  switch (e.status) {
    case 401:
      return 'Your session expired. Please sign in again.';
    case 403:
      return e.message || 'Access denied.';
    case 404:
      return 'Not found.';
    case 413:
      return 'File too large. Maximum size is 10MB.';
    case 415:
      return 'File type not supported.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Please try again.';
  }

  if (!navigator.onLine) {
    return 'No internet connection. Please check your network.';
  }

  if (e.message?.toLowerCase().includes('failed to fetch') || e.message?.toLowerCase().includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  return e.message || 'Something went wrong. Please try again.';
}

export function isRetryableError(err: unknown): boolean {
  const e = err as ApiError;
  if (!e.status) return true; // network error — retry
  return e.status >= 500; // only retry server errors, not 4xx
}
