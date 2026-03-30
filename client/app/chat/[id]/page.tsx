export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center p-8">
      <p className="text-muted-foreground text-sm">
        Conversation <span className="font-mono text-foreground">{id}</span>
      </p>
      <p className="text-muted-foreground text-xs">Chat UI coming in Phase 4</p>
    </div>
  );
}
