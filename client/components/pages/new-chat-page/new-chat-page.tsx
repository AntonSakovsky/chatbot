'use client';

import { useRouter } from 'next/navigation';
import { useCreateConversation } from '@/hooks/use-conversations';
import { MessageInput } from '@/components/chat/message-input/message-input';

export function NewChatPage() {
  const router = useRouter();
  const { mutate: createConversation, isPending } = useCreateConversation();

  function handleSend(content: string) {
    createConversation(undefined, {
      onSuccess: (conversation) => {
        router.push(`/chat/${conversation.id}?msg=${encodeURIComponent(content)}`);
      },
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xl font-bold">C</span>
        </div>
        <h1 className="text-2xl font-semibold">How can I help you?</h1>
        <p className="text-sm text-muted-foreground">Start a conversation below.</p>
      </div>
      <MessageInput onSend={handleSend} disabled={isPending} />
    </div>
  );
}
