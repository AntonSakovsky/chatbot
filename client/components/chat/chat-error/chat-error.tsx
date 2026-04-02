import type { ApiError } from '@/lib/error-utils';

type ChatErrorProps = {
  error: Error | null;
};

export const ChatError = ({ error }: ChatErrorProps) => {
  if (!error) return null;
  return (
    <div className="text-center pb-2 px-4">
      <p className="text-xs text-destructive">{error.message}</p>
      {(error as ApiError).code === 'LIMIT_REACHED' && (
        <a
          href="/login"
          className="text-xs underline text-muted-foreground hover:text-foreground mt-1 inline-block"
        >
          Sign in to continue →
        </a>
      )}
    </div>
  );
};
