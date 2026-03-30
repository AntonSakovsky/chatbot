export default function NewChatPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
        <span className="text-primary-foreground text-xl font-bold">C</span>
      </div>
      <h1 className="text-2xl font-semibold">How can I help you?</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        Start a new conversation. Chat UI coming in the next phase.
      </p>
    </div>
  );
}
