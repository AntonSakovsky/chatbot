'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { apiClient, streamPost } from '@/lib/api-client';
import { getOrCreateAnonToken } from '@/lib/anon-token';
import { getErrorMessage, type ApiError } from '@/lib/error-utils';
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

  const sendMessage = useCallback(
    async (content: string) => {
      getOrCreateAnonToken();
      setError(null);
      setIsStreaming(true);
      setStreamingContent('');

      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          role: 'user' as const,
          content,
          created_at: new Date().toISOString(),
          attachments: [],
        },
      ]);

      try {
        const reader = await streamPost('/api/anonymous/chat', { content });
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.delta) {
                fullText += parsed.delta;
                setStreamingContent(fullText);
              }
            } catch (parseErr: any) {
              if (parseErr?.message && !parseErr.message.includes('JSON')) throw parseErr;
            }
          }
        }

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

        queryClient.invalidateQueries({ queryKey: ['anon-status'] });
      } catch (err) {
        const e = err as ApiError;
        const friendly = getErrorMessage(e);
        setError(Object.assign(new Error(friendly), e));
        setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [queryClient]
  );

  return { messages, sendMessage, streamingContent, isStreaming, error };
}
