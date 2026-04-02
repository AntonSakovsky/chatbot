'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useDeleteConversation } from '@/hooks/use-conversations';
import type { Conversation } from '@/hooks/use-conversations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type SidebarItemProps = {
  conversation: Conversation;
  onClose?: () => void;
};

export const SidebarItem = ({ conversation, onClose }: SidebarItemProps) => {
  const params = useParams();
  const router = useRouter();
  const isActive = params?.id === conversation.id;
  const { mutate: deleteConversation, isPending } = useDeleteConversation();
  const [open, setOpen] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  const handleConfirm = () => {
    deleteConversation(conversation.id, {
      onSuccess: () => {
        setOpen(false);
        if (isActive) router.push('/chat');
      },
    });
  };

  return (
    <>
      <Link
        href={`/chat/${conversation.id}`}
        onClick={onClose}
        className={`group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
        }`}
      >
        <span className="truncate">{conversation.title}</span>
        <button
          onClick={handleDeleteClick}
          className="shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
          aria-label="Delete conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </Link>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete conversation</DialogTitle>
            <DialogDescription>
              &ldquo;{conversation.title}&rdquo; will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
