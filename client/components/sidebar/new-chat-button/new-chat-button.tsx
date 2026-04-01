'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useCreateConversation } from '@/hooks/use-conversations';

type NewChatButtonProps = {
  onClose?: () => void;
};

export const NewChatButton = ({ onClose }: NewChatButtonProps) => {
  const router = useRouter();
  const { mutate: createConversation, isPending } = useCreateConversation();

  const handleClick = () => {
    createConversation(undefined, {
      onSuccess: (conversation) => {
        onClose?.();
        router.push(`/chat/${conversation.id}`);
      },
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
      aria-label="New chat"
    >
      <Plus className="w-4 h-4 shrink-0" />
      <span>New chat</span>
    </button>
  );
}
