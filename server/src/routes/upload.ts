import { Router, Response } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { supabase } from '../services/supabase';
import { uploadFile } from '../services/storage';

const router = Router();

const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

router.post('/', requireAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' });
    return;
  }

  const { originalname, mimetype, buffer } = req.file;

  const { path: storagePath } = await uploadFile(buffer, originalname, mimetype);

  let extractedText: string | null = null;

  if (mimetype === 'application/pdf') {
    try {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text;
    } catch {
      // extraction failure is non-fatal
    }
  } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } catch {
      // extraction failure is non-fatal
    }
  } else if (mimetype === 'text/plain') {
    extractedText = buffer.toString('utf-8');
  }

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      file_name: originalname,
      storage_path: storagePath,
      mime_type: mimetype,
      extracted_text: extractedText,
    })
    .select('id, file_name, mime_type')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});

export default router;
