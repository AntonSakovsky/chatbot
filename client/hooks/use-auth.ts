'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/dist/client/components/navigation';
import { useCallback, useEffect, useState } from 'react';

type AuthStateChangePayload = { data: { session: { user: User } | null } };

const supabase = createSupabaseBrowserClient();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: AuthStateChangePayload) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: any, session: Session | null) => {
        setUser(session?.user ?? null);
        // Keep localStorage token in sync for api-client.ts
        if (session?.access_token) {
          localStorage.setItem('sb-access-token', session.access_token);
        } else {
          localStorage.removeItem('sb-access-token');
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('anon_token');
    queryClient.removeQueries({ queryKey: ['conversations'] });
    queryClient.removeQueries({ queryKey: ['anon-status'] });
    router.push('/chat');
  }, [router, queryClient]);

  return { user, loading, signInWithEmail, signUpWithEmail, signOut };
}
