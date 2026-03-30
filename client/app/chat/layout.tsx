export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <aside className="w-64 shrink-0 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="h-8 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex-1 p-2 space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-muted/50 animate-pulse" />
          ))}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}
