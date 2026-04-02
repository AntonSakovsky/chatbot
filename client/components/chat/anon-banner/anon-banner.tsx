import { useAnonStatus } from '@/hooks/use-anonymous';
import { User } from '@supabase/supabase-js';
import Link from 'next/link';

type AnonBannerProps = {
  user: User | null;
};

export const AnonBanner = ({ user } : AnonBannerProps) => {
  const { data, isLoading } = useAnonStatus();

  if (user || (!isLoading && !data)) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-muted/60 border-b border-border px-4 py-2 text-sm">
      <span className="text-muted-foreground">
        {isLoading && (
          <>
            <span className="inline-block h-4 w-4 animate-pulse rounded bg-muted-foreground/30 align-middle" />{' '}
            free questions remaining
          </>
        )}
        {!isLoading && data!.remaining > 0 && (
          <>
            <span className="text-foreground font-medium">{data!.remaining}</span> free{' '}
            {data!.remaining === 1 ? 'question' : 'questions'} remaining
          </>
        )}
        {!isLoading && data!.remaining === 0 && (
          <span className="text-destructive font-medium">Free question limit reached</span>
        )}
      </span>
      <Link
        href="/login"
        className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Sign in to continue
      </Link>
    </div>
  );
};
