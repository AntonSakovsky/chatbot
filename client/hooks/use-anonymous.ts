'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import { apiClient, streamPost } from '@/lib/api-client';
import { getOrCreateAnonToken } from '@/lib/anon-token';
import { getErrorMessage, type ApiError } from '@/lib/error-utils';
import { readSSEStream } from '@/lib/stream-utils';
import type { Message } from './use-messages';

export function useAnonStatus() {
  return useQuery<{ remaining: number; used: number }>({
    queryKey: ['anon-status'],
    queryFn: async () => {
      getOrCreateAnonToken();
      const { data } = await apiClient.get('/api/anonymous/status');
      return data;
    },
    staleTime: 0,
  });
}

export function useAnonChat() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      getOrCreateAnonToken();
      setError(null);
      setIsStreaming(true);
      setStreamingContent('');

      const tempId = `temp-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          role: 'user' as const,
          content,
          created_at: new Date().toISOString(),
          attachments: [],
        },
      ]);

      try {
        const reader = await streamPost('/api/anonymous/chat', { content }, abortController.signal);
        const { fullText, userAborted } = await readSSEStream(reader, setStreamingContent);

        if (fullText) {
          setMessages((prev) => [
            ...prev,
            {
              id: `anon-${Date.now()}`,
              role: 'assistant' as const,
              content: fullText,
              created_at: new Date().toISOString(),
              attachments: [],
            },
          ]);
        }

        if (!userAborted) {
          queryClient.invalidateQueries({ queryKey: ['anon-status'] });
        }
      } catch (err) {
        const e = err as ApiError;
        const friendly = getErrorMessage(e);
        setError(Object.assign(new Error(friendly), e));
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [queryClient]
  );

  return { messages, sendMessage, stopStreaming, streamingContent, isStreaming, error };
}
