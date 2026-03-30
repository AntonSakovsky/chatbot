'use client';

import Link from 'next/link';
import { useAnonStatus } from '@/hooks/use-anonymous';
import { useAuth } from '@/hooks/use-auth';

export function AnonBanner() {
  const { user } = useAuth();
  const { data } = useAnonStatus();

  if (user || !data) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-muted/60 border-b border-border px-4 py-2 text-sm">
      <span className="text-muted-foreground">
        {data.remaining > 0 ? (
          <>
            <span className="text-foreground font-medium">{data.remaining}</span> free{' '}
            {data.remaining === 1 ? 'question' : 'questions'} remaining
          </>
        ) : (
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
}
