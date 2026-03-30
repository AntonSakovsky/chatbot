'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMessages, useSendMessage } from '@/hooks/use-messages';
import { useAnonChat } from '@/hooks/use-anonymous';
import { useAuth } from '@/hooks/use-auth';
import { useRealtimeMessages } from '@/hooks/use-realtime-sync';
import { MessageList } from '@/components/chat/message-list/message-list';
import { MessageInput } from '@/components/chat/message-input/message-input';

type ConversationPageProps = {
  id: string;
};

export function ConversationPage({ id }: ConversationPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialMessage = searchParams.get('msg');
  const didAutoSend = useRef(false);
  const { user } = useAuth();

  const { data: messages = [], isLoading } = useMessages(user ? id : null);

  const auth = useSendMessage(id);
  const anon = useAnonChat(id);

  const { sendMessage, streamingContent, isStreaming, error } = user ? auth : anon;

  useRealtimeMessages(user ? id : null, isStreaming);

  useEffect(() => {
    if (initialMessage && !didAutoSend.current) {
      didAutoSend.current = true;
      router.replace(`/chat/${id}`);
      sendMessage(initialMessage);
    }
  }, [initialMessage, id, sendMessage, router]);

  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        isLoading={isLoading}
      />
      {error && (
        <p className="text-xs text-destructive text-center pb-2">{error.message}</p>
      )}
      <MessageInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
