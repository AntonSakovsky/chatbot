import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { apiClient, streamPost } from '@/lib/api-client';

export interface Attachment {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  attachments?: Attachment[];
}

export function useMessages(conversationId: string | null) {
  return useQuery<Message[]>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/conversations/${conversationId}/messages`);
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(
    async (content: string, attachmentIds: string[] = []) => {
      setError(null);
      setIsStreaming(true);
      setStreamingContent('');

      // Optimistically add user message
      queryClient.setQueryData<Message[]>(['messages', conversationId], (prev) => [
        ...(prev ?? []),
        {
          id: `temp-${Date.now()}`,
          role: 'user',
          content,
          created_at: new Date().toISOString(),
          attachments: [],
        },
      ]);

      try {
        const reader = await streamPost(
          `/api/conversations/${conversationId}/messages`,
          { content, attachmentIds }
        );

        const decoder = new TextDecoder();
        let fullText = '';

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
              const { delta } = JSON.parse(payload);
              if (delta) {
                fullText += delta;
                setStreamingContent(fullText);
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }

        // Refresh messages from server to get the persisted assistant message
        await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
        await queryClient.invalidateQueries({ queryKey: ['conversations'] });
      } catch (err) {
        setError(err as Error);
        // Remove optimistic user message on failure
        await queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      } finally {
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [conversationId, queryClient]
  );

  return { sendMessage, streamingContent, isStreaming, error };
}
