'use client';

import { useAnonChat } from '@/hooks/use-anonymous';
import { MessageList } from '@/components/chat/message-list/message-list';
import { MessageInput } from '@/components/chat/message-input/message-input';
import type { ApiError } from '@/lib/error-utils';

export const AnonChat = () => {
  const { messages, sendMessage, streamingContent, isStreaming, error } = useAnonChat();

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-4 sm:p-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-semibold">How can I help you?</h1>
          <p className="text-sm text-muted-foreground">Ask up to 3 free questions. Sign in to save history.</p>
        </div>
      ) : (
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          isLoading={false}
        />
      )}
      {error && (
        <div className="text-center pb-2 px-4">
          <p className="text-xs text-destructive">{error.message}</p>
          {(error as ApiError).code === 'LIMIT_REACHED' && (
            <a
              href="/login"
              className="text-xs underline text-muted-foreground hover:text-foreground mt-1 inline-block"
            >
              Sign in to continue →
            </a>
          )}
        </div>
      )}
      <MessageInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
};
