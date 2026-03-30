'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

type MessageInputProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
};

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  return (
    <div className="p-4 border-t border-border">
      <div className="relative flex items-end gap-2 bg-muted rounded-2xl px-4 py-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message ChatBot..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none text-sm outline-none placeholder:text-muted-foreground max-h-50 leading-relaxed disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-opacity disabled:opacity-30 hover:opacity-90"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-2">
        ChatBot can make mistakes. Consider checking important information.
      </p>
    </div>
  );
}
