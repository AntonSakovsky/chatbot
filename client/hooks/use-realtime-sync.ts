'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase-realtime';
import type { User } from '@supabase/supabase-js';

export function useRealtimeSync(user: User | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}

export function useRealtimeMessages(conversationId: string | null, isStreaming: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          // Don't interrupt the streaming tab — it handles its own refresh
          if (!isStreaming) {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, isStreaming, queryClient]);
}
