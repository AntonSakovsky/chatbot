'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useMessages, useSendMessage } from '@/hooks/use-messages';
import { useRealtimeMessages } from '@/hooks/use-realtime-sync';
import { MessageList } from '@/components/chat/message-list/message-list';
import { MessageInput } from '@/components/chat/message-input/message-input';
import { ChatError } from '@/components/chat/chat-error/chat-error';

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
    <div className="flex flex-col h-[calc(100%-44px)] md:h-full">
      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        isLoading={isLoading}
      />
      <ChatError error={error} />
      <MessageInput onSend={sendMessage} isStreaming={isStreaming} onStop={stopStreaming} />
    </div>
  );
}
