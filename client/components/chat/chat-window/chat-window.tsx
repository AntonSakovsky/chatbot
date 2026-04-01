'use client';

import { useMessages, useSendMessage } from '@/hooks/use-messages';
import { MessageList } from '@/components/chat/message-list/message-list';
import { MessageInput } from '@/components/chat/message-input/message-input';

type ChatWindowProps = {
  conversationId: string;
};

export const ChatWindow = ({ conversationId }: ChatWindowProps) => {
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const { sendMessage, streamingContent, isStreaming, error } = useSendMessage(conversationId);

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
