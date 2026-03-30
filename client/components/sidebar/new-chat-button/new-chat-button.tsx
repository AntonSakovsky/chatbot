'use client';

import { useRouter } from 'next/navigation';
import { SquarePen } from 'lucide-react';
import { useCreateConversation } from '@/hooks/use-conversations';

export function NewChatButton() {
  const router = useRouter();
  const { mutate: createConversation, isPending } = useCreateConversation();

  function handleClick() {
    createConversation(undefined, {
      onSuccess: (conversation) => {
        router.push(`/chat/${conversation.id}`);
      },
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
      aria-label="New chat"
    >
      <SquarePen className="w-4 h-4" />
    </button>
  );
}
