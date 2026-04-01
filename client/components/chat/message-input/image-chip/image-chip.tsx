import { Loader2, X } from 'lucide-react';
import type { PendingFile } from '../types';

type ImageChipProps = {
  file: PendingFile;
  onRemove: () => void;
};

export const ImageChip = ({ file, onRemove }: ImageChipProps) => (
  <div className="relative w-20 h-20 rounded-xl border border-border overflow-hidden shrink-0">
    <img src={file.objectUrl} alt={file.file.name} className="w-full h-full object-cover" />
    {(file.uploading || file.error) && (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
        {file.uploading
          ? <Loader2 className="w-5 h-5 animate-spin text-white" />
          : <span className="text-white text-xs font-medium">Failed</span>
        }
      </div>
    )}
    <button
      type="button"
      onClick={onRemove}
      aria-label="Remove"
      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 transition-colors flex items-center justify-center"
    >
      <X className="w-3 h-3 text-white" />
    </button>
  </div>
);
