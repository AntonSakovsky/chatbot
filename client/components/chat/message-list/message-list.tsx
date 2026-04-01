'use client';

import { useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Message } from '@/components/chat/message/message';
import { StreamingMessage } from '@/components/chat/message/streaming-message/streaming-message';
import type { Message as MessageType } from '@/hooks/use-messages';

type MessageListProps = {
  messages: MessageType[];
  streamingContent: string;
  isStreaming: boolean;
  isLoading: boolean;
};

export const MessageList = ({ messages, streamingContent, isStreaming, isLoading }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {isStreaming && <StreamingMessage content={streamingContent} />}
      <div ref={bottomRef} />
    </div>
  );
}
