'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
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
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
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
