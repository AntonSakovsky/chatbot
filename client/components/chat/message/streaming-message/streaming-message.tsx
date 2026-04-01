type StreamingMessageProps = {
  content: string;
};

export const StreamingMessage = ({ content }: StreamingMessageProps) => (
  <div className="flex gap-3 justify-start">
    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
      <span className="text-primary-foreground text-xs font-bold">C</span>
    </div>
    <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-muted text-foreground">
      {content ? (
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      ) : (
        <div className="flex gap-1 items-center h-5">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
      )}
    </div>
  </div>
);
