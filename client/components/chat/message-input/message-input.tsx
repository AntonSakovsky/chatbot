'use client';

import { uploadFile } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { ArrowUp, Paperclip, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FileChip } from './file-chip/file-chip';
import type { OptimisticAttachment, PendingFile } from './types';

const ACCEPTED =
  'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type MessageInputProps = {
  onSend: (
    content: string,
    attachmentIds: string[],
    optimisticAttachments: OptimisticAttachment[],
  ) => void;
  isStreaming?: boolean;
  onStop?: () => void;
};

export const MessageInput = ({ onSend, isStreaming, onStop }: MessageInputProps) => {
  const [value, setValue] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus();
  }, [isStreaming]);

  const uploadAndTrack = useCallback(async (file: File) => {
    const localId = `${Date.now()}-${Math.random()}`;
    const objectUrl = URL.createObjectURL(file);

    setPendingFiles((prev) => [...prev, { localId, file, objectUrl, uploading: true }]);

    try {
      const result = await uploadFile(file);
      setPendingFiles((prev) =>
        prev.map((f) =>
          f.localId === localId
            ? {
                ...f,
                uploading: false,
                uploadedId: result.id,
                file_name: result.file_name,
                mime_type: result.mime_type,
                url: result.url,
              }
            : f,
        ),
      );
    } catch {
      setPendingFiles((prev) =>
        prev.map((f) =>
          f.localId === localId ? { ...f, uploading: false, error: 'Upload failed' } : f,
        ),
      );
    }
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => Array.from(files).forEach((f) => uploadAndTrack(f)),
    [uploadAndTrack],
  );

  const removeFile = (localId: string) => {
    setPendingFiles((prev) => {
      const f = prev.find((f) => f.localId === localId);
      if (f) URL.revokeObjectURL(f.objectUrl);
      return prev.filter((f) => f.localId !== localId);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const fileItems = Array.from(e.clipboardData.items).filter((i) => i.kind === 'file');
    if (!fileItems.length) return;
    e.preventDefault();
    addFiles(fileItems.map((i) => i.getAsFile()).filter(Boolean) as File[]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const handleSubmit = () => {
    if (isStreaming) return;
    const trimmed = value.trim();
    const readyFiles = pendingFiles.filter((f) => f.uploadedId);
    if (!trimmed && !readyFiles.length) return;
    if (pendingFiles.some((f) => f.uploading)) return;

    const attachmentIds = readyFiles.map((f) => f.uploadedId!);
    const optimisticAttachments: OptimisticAttachment[] = readyFiles.map((f) => ({
      id: f.uploadedId!,
      file_name: f.file_name ?? f.file.name,
      mime_type: f.mime_type ?? f.file.type,
      storage_path: '',
      url: f.url ?? f.objectUrl,
    }));
    setPendingFiles([]);
    onSend(trimmed, attachmentIds, optimisticAttachments);
    setValue('');
  };

  const isUploading = pendingFiles.some((f) => f.uploading);
  const canSend =
    !isStreaming && (value.trim() || pendingFiles.some((f) => f.uploadedId)) && !isUploading;

  return (
    <div className=" px-4 py-4">
      <div className="mx-auto w-full min-[1250px]:max-w-3/4">
        <div
          className="relative flex flex-col gap-2 bg-muted rounded-2xl px-4 py-3"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {pendingFiles.map((f) => (
                <FileChip key={f.localId} file={f} onRemove={() => removeFile(f.localId)} />
              ))}
            </div>
          )}

          <div
            className={cn('flex gap-2', {
              'items-center': value.split('\n').length === 1,
              'items-end': value.split('\n').length > 1,
            })}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Message ChatBot..."
              rows={1}
              className="flex-1 bg-transparent resize-none text-sm outline-none placeholder:text-muted-foreground max-h-50 leading-relaxed"
            />

            {isStreaming ? (
              <button
                onClick={onStop}
                className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label="Stop generating"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSend}
                className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-opacity disabled:opacity-30 hover:opacity-90"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-2">
          ChatBot can make mistakes. Consider checking important information.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
};
