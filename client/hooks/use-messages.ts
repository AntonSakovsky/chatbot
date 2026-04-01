import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, streamPost } from '@/lib/api-client';
import { getErrorMessage, type ApiError } from '@/lib/error-utils';

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

  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get(`/api/conversations/${conversationId}/messages`);
        
        const imageUrls: string[] = (data as Message[])
          .flatMap(m => m.attachments ?? [])
          .filter(a => a.mime_type.startsWith('image/') && a.url)
          .map(a => a.url as string);

        if (imageUrls.length > 0) {
          await Promise.all(imageUrls.map(url => new Promise<void>(resolve => {
            const img = new window.Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
          })));
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

        const decoder = new TextDecoder();
        let fullText = '';
        let userAborted = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
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
        } catch (readErr: any) {
          if (readErr?.name === 'AbortError') {
            userAborted = true;
          } else {
            throw readErr;
          }
        }

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
