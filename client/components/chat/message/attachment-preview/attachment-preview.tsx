import { ExternalLink, FileText, X } from 'lucide-react';
import type { Attachment } from '@/hooks/use-messages';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';

type AttachmentPreviewProps = {
  attachment: Attachment;
};

export const AttachmentPreview = ({ attachment }: AttachmentPreviewProps) => {
  const isImage = attachment.mime_type.startsWith('image/');
  const url = attachment.url ?? undefined;

  if (isImage) {
    return (
      <Dialog>
        <DialogTrigger className="p-0 border-0 bg-transparent cursor-pointer rounded-lg overflow-hidden block">
          <img
            src={url}
            alt={attachment.file_name}
            className="max-w-48 max-h-48 object-cover rounded-lg"
          />
        </DialogTrigger>
        <DialogContent showCloseButton={false} className="sm:max-w-[90vw] w-fit p-2">
          <img
            src={url}
            alt={attachment.file_name}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded"
          />
          <DialogClose className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 transition-colors flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </DialogClose>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-lg px-2 py-1.5 text-xs"
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-36">{attachment.file_name}</span>
      <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
    </a>
  );
};
