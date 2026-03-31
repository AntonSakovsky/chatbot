'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/sidebar/sidebar/sidebar';
import { AnonBanner } from '@/components/chat/anon-banner/anon-banner';

type ChatShellProps = {
  children: React.ReactNode;
};

export function ChatShell({ children }: ChatShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full">
      <aside className="w-64 shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        <Sidebar />
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r border-border transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 px-3 h-11 shrink-0 border-b border-border md:hidden">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold">ChatBot</span>
        </div>
        <AnonBanner />
        {children}
      </main>
    </div>
  );
}
