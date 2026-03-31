'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useConversations } from '@/hooks/use-conversations';
import { useRealtimeSync } from '@/hooks/use-realtime-sync';
import { cn } from '@/lib/utils';
import { LogIn, LogOut, MessageSquare, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NewChatButton } from '@/components/sidebar/new-chat-button/new-chat-button';
import { SidebarItem } from '@/components/sidebar/sidebar-item/sidebar-item';

type SidebarProps = {
  onClose?: () => void;
};

export function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: conversations, isLoading } = useConversations();
  useRealtimeSync(user);

  const onSignInClick = () => {
    onClose?.();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Link href="/chat" className="flex items-center gap-2 font-semibold text-sm" onClick={onClose}>
          <MessageSquare className="w-4 h-4" />
          ChatBot
        </Link>
        <div className="flex items-center gap-1">
          <NewChatButton onClose={onClose} />
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
        ) : !conversations?.length ? (
          <p className="text-xs text-muted-foreground text-center mt-8">No conversations yet</p>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conversation) => (
              <SidebarItem key={conversation.id} conversation={conversation} onClose={onClose} />
            ))}
          </div>
        )}
      </div>

      <div className="p-2 border-t border-border">
        <button
          onClick={user ? signOut : onSignInClick}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors', {['hover:text-red-400']: user}
          )}
        >
          {user ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          {user ? 'Sign out' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}
