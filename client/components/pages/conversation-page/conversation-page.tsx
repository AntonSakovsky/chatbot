'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages, useSendMessage } from '@/hooks/use-messages';
import { useRealtimeMessages } from '@/hooks/use-realtime-sync';
import type { ApiError } from '@/lib/error-utils';
import { MessageList } from '@/components/chat/message-list/message-list';
import { MessageInput } from '@/components/chat/message-input/message-input';

type ConversationPageProps = {
  id: string;
};

export const ConversationPage = ({ id }: ConversationPageProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const initialMessage = searchParams.get('msg');
  const didAutoSend = useRef(false);

  const { data: messages = [], isLoading } = useMessages(id);
  const { sendMessage, stopStreaming, streamingContent, isStreaming, error } = useSendMessage(id);

  useRealtimeMessages(id, isStreaming);

  useEffect(() => {
    if (didAutoSend.current) return;

    const pendingKey = `pendingMsg_${id}`;
    const pendingRaw = sessionStorage.getItem(pendingKey);

    if (pendingRaw) {
      didAutoSend.current = true;
      sessionStorage.removeItem(pendingKey);
      const { content, attachmentIds, optimisticAttachments } = JSON.parse(pendingRaw);
      queryClient.cancelQueries({ queryKey: ['messages', id] });
      sendMessage(content, attachmentIds, optimisticAttachments);
    } else if (initialMessage) {
      didAutoSend.current = true;
      router.replace(`/chat/${id}`);
      queryClient.cancelQueries({ queryKey: ['messages', id] });
      sendMessage(initialMessage);
    }
  }, [initialMessage, id, sendMessage, router, queryClient]);

  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        isLoading={isLoading}
      />
      {error && (
        <div className="text-center pb-2 px-4">
          <p className="text-xs text-destructive">{error.message}</p>
          {(error as ApiError).code === 'LIMIT_REACHED' && (
            <a href="/login" className="text-xs underline text-muted-foreground hover:text-foreground mt-1 inline-block">
              Sign in to continue →
            </a>
          )}
        </div>
      )}
      <MessageInput onSend={sendMessage} isStreaming={isStreaming} onStop={stopStreaming} />
    </div>
  );
}
