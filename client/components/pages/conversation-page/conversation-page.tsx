'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  const initialMessage = searchParams.get('msg');
  const didAutoSend = useRef(false);

  const { data: messages = [], isLoading } = useMessages(id);
  const { sendMessage, streamingContent, isStreaming, error } = useSendMessage(id);

  useRealtimeMessages(id, isStreaming);

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
        <div className="text-center pb-2 px-4">
          <p className="text-xs text-destructive">{error.message}</p>
          {(error as ApiError).code === 'LIMIT_REACHED' && (
            <a href="/login" className="text-xs underline text-muted-foreground hover:text-foreground mt-1 inline-block">
              Sign in to continue →
            </a>
          )}
        </div>
      )}
      <MessageInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
