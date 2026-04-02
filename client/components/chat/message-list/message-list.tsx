'use client';

import { Message } from '@/components/chat/message/message';
import { StreamingMessage } from '@/components/chat/message/streaming-message/streaming-message';
import type { Message as MessageType } from '@/hooks/use-messages';
import { ArrowDown, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type MessageListProps = {
  messages: MessageType[];
  streamingContent: string;
  isStreaming: boolean;
  isLoading: boolean;
};

export const MessageList = ({
  messages,
  streamingContent,
  isStreaming,
  isLoading,
}: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const bottom = bottomRef.current;

    if (!container || !bottom) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isInitialLoad = prevMessagesLengthRef.current === 0;
        const last = messages[messages.length - 1];
        const isUserSent = isInitialLoad || last.role === 'user';

        setShowScrollButton(!entry.isIntersecting && !isUserSent);
      },
      {
        root: container,
        threshold: 1.0,
      },
    );

    observer.observe(bottom);

    return () => observer.disconnect();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) return;

    const isInitialLoad = prevMessagesLengthRef.current === 0;
    prevMessagesLengthRef.current = messages.length;

    const last = messages[messages.length - 1];

    if (isInitialLoad || last.role === 'user') {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      <div className="h-full overflow-y-auto" ref={scrollContainerRef}>
        <div className="mx-auto w-full min-[1250px]:max-w-3/4 px-4 py-4 space-y-4">
          {messages.map((message) => (
            <Message key={message.id} message={message} />
          ))}
          {isStreaming && <StreamingMessage content={streamingContent} />}
          <div ref={bottomRef} />
        </div>
      </div>

      {showScrollButton && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm shadow-md hover:bg-secondary/80 transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
            Scroll to bottom
          </button>
        </div>
      )}
    </div>
  );
};
