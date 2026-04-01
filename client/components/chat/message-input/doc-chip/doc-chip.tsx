import { FileText, Loader2, X } from 'lucide-react';
import type { PendingFile } from '../types';

type DocChipProps = {
  file: PendingFile;
  onRemove: () => void;
};

export const DocChip = ({ file, onRemove }: DocChipProps) => (
  <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg px-2 py-1.5 text-xs max-w-45">
    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
    <span className="truncate text-foreground">{file.file.name}</span>
    {file.uploading && <Loader2 className="w-3 h-3 shrink-0 animate-spin text-muted-foreground" />}
    {file.error && <span className="text-destructive shrink-0">!</span>}
    <button
      type="button"
      onClick={onRemove}
      aria-label="Remove"
      className="shrink-0 text-muted-foreground hover:text-foreground ml-auto"
    >
      <X className="w-3 h-3" />
    </button>
  </div>
);
