import { Sidebar } from '@/components/sidebar/sidebar/sidebar';
import { AnonBanner } from '@/components/chat/anon-banner/anon-banner';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <aside className="w-64 shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        <Sidebar />
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <AnonBanner />
        {children}
      </main>
    </div>
  );
}
