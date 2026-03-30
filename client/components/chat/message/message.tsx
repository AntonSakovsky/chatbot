import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { Message as MessageType } from '@/hooks/use-messages';

type MessageProps = {
  message: MessageType;
};

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-primary-foreground text-xs font-bold">C</span>
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted text-foreground rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return isInline ? (
                  <code className="bg-black/20 rounded px-1 py-0.5 text-xs font-mono" {...props}>
                    {children}
                  </code>
                ) : (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg mt-2! mb-2! text-xs"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                );
              },
              p({ children }) {
                return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
              },
              ul({ children }) {
                return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>;
              },
              ol({ children }) {
                return <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>;
              },
              h1({ children }) {
                return <h1 className="text-base font-bold mb-2">{children}</h1>;
              },
              h2({ children }) {
                return <h2 className="text-sm font-bold mb-1.5">{children}</h2>;
              },
              h3({ children }) {
                return <h3 className="text-sm font-semibold mb-1">{children}</h3>;
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-2 border-muted-foreground/40 pl-3 italic text-muted-foreground my-2">
                    {children}
                  </blockquote>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

type StreamingMessageProps = {
  content: string;
};

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
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
}
