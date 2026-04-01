export type PendingFile = {
  localId: string;
  file: File;
  objectUrl: string;
  uploadedId?: string;
  file_name?: string;
  mime_type?: string;
  uploading: boolean;
  error?: string;
};

export type OptimisticAttachment = {
  id: string;
  file_name: string;
  mime_type: string;
  storage_path: string;
  url: string;
};
