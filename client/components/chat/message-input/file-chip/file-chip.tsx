import { DocChip } from '../doc-chip/doc-chip';
import { ImageChip } from '../image-chip/image-chip';
import type { PendingFile } from '../types';

type FileChipProps = {
  file: PendingFile;
  onRemove: () => void;
};

export const FileChip = ({ file, onRemove }: FileChipProps) =>
  file.file.type.startsWith('image/')
    ? <ImageChip file={file} onRemove={onRemove} />
    : <DocChip file={file} onRemove={onRemove} />;
