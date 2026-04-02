import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, streamPost } from '@/lib/api-client';
import { getErrorMessage, type ApiError } from '@/lib/error-utils';
import { readSSEStream } from '@/lib/stream-utils';

export type Attachment = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  url: string | null;
}

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  attachments?: Attachment[];
}

export function useMessages(conversationId: string | null) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/api/conversations/${conversationId}/messages`);

        const cached = queryClient.getQueryData<Message[]>(['messages', conversationId]);
        if (cached) {
          const urlById = new Map<string, string>();
          for (const msg of cached) {
            for (const att of msg.attachments ?? []) {
              if (att.url) urlById.set(att.id, att.url);
            }
          }
          if (urlById.size > 0) {
            return (data as Message[]).map((msg: Message) => ({
              ...msg,
              attachments: (msg.attachments ?? []).map((att: Attachment) => ({
                ...att,
                url: urlById.get(att.id) ?? att.url,
              })),
            }));
          }
        }

        return data;
      } catch (err) {
        const e = err as ApiError;
        if (e.status === 404) {
          router.replace('/chat');
          return [];
        }
        throw err;
      }
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const sendMessage = useCallback(
    async (content: string, attachmentIds: string[] = [], optimisticAttachments: Attachment[] = []) => {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setError(null);
      setIsStreaming(true);
      setStreamingContent('');

      queryClient.setQueryData<Message[]>(['messages', conversationId], (prev) => [
        ...(prev ?? []),
        {
          id: `temp-${Date.now()}`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
          attachments: optimisticAttachments,
        },
      ]);

      try {
        const reader = await streamPost(
          `/api/conversations/${conversationId}/messages`,
          { content, attachmentIds },
          abortController.signal
        );

        const { fullText, userAborted } = await readSSEStream(reader, setStreamingContent, abortController.signal);

        if (fullText) {
          queryClient.setQueryData<Message[]>(['messages', conversationId], (prev) => [
            ...(prev ?? []),
            {
              id: `temp-assistant-${Date.now()}`,
              role: 'assistant' as const,
              content: fullText,
              created_at: new Date().toISOString(),
              attachments: [],
            },
          ]);
        }

        if (!userAborted) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        }
      } catch (err) {
        const friendly = getErrorMessage(err);
        setError(Object.assign(new Error(friendly), err as object));
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [conversationId, queryClient]
  );

  return { sendMessage, stopStreaming, streamingContent, isStreaming, error };
}
