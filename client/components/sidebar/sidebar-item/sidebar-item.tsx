'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useDeleteConversation } from '@/hooks/use-conversations';
import type { Conversation } from '@/hooks/use-conversations';

type SidebarItemProps = {
  conversation: Conversation;
};

export function SidebarItem({ conversation }: SidebarItemProps) {
  const params = useParams();
  const router = useRouter();
  const isActive = params?.id === conversation.id;
  const { mutate: deleteConversation } = useDeleteConversation();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    deleteConversation(conversation.id, {
      onSuccess: () => {
        if (isActive) router.push('/chat');
      },
    });
  }

  return (
    <Link
      href={`/chat/${conversation.id}`}
      className={`group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      }`}
    >
      <span className="truncate">{conversation.title}</span>
      <button
        onClick={handleDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
        aria-label="Delete conversation"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </Link>
  );
}
