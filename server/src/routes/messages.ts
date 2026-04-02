import { Response, Router } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { ConversationMessage, generateTitle, streamGeminiResponse } from '../services/llm';
import { getFileAsBase64, getSignedUrls } from '../services/storage';
import { supabase } from '../services/supabase';

type AttachmentRow = {
  id: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  extracted_text?: string | null;
};

type UserPart =
  | { type: 'text'; text: string }
  | { type: 'image'; mimeType: string; data: string };

const router = Router({ mergeParams: true });

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.userId!)
    .single();

  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  const { data, error } = await supabase
    .from('messages')
    .select(`
      id, role, content, created_at,
      attachments (id, file_name, storage_path, mime_type)
    `)
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('GET /messages:', error.message);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  const allAttachments = (data ?? []).flatMap(m => (m.attachments as AttachmentRow[]) ?? []);
  const paths = allAttachments.map(a => a.storage_path);
  const signedUrls = paths.length > 0 ? await getSignedUrls(paths) : {};

  const messagesWithUrls = (data ?? []).map(m => ({
    ...m,
    attachments: ((m.attachments as AttachmentRow[]) ?? []).map(att => ({
      ...att,
      url: signedUrls[att.storage_path] ?? null,
    })),
  }));

  res.json(messagesWithUrls);
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id: conversationId } = req.params;
  const { content, attachmentIds = [] } = req.body as {
    content: string;
    attachmentIds?: string[];
  };

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title')
    .eq('id', conversationId)
    .eq('user_id', req.userId!)
    .single();

  if (!conv) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }

  let attachments: AttachmentRow[] = [];
  if (attachmentIds.length > 0) {
    const { data } = await supabase
      .from('attachments')
      .select('id, file_name, storage_path, mime_type, extracted_text')
      .in('id', attachmentIds);
    attachments = data ?? [];
  }

  const { data: userMessage, error: insertError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'user', content })
    .select('id')
    .single();

  if (insertError) {
    console.error('POST /messages insert:', insertError.message);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }

  if (attachments.length > 0) {
    await supabase
      .from('attachments')
      .update({ message_id: userMessage.id })
      .in('id', attachmentIds);
  }

  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50);

  const conversationHistory: ConversationMessage[] = (history ?? [])
    .slice(0, -1)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

  const userParts: UserPart[] = [];

  for (const att of attachments) {
    if (att.extracted_text) {
      userParts.push({ type: 'text', text: `[Document: ${att.file_name}]\n${att.extracted_text}\n` });
    } else if (att.mime_type.startsWith('image/')) {
      const base64 = await getFileAsBase64(att.storage_path);
      userParts.push({ type: 'image', mimeType: att.mime_type, data: base64 });
    }
  }

  userParts.push({ type: 'text', text: content });

  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  const assistantText = await streamGeminiResponse(userParts, conversationHistory, res, abortController.signal);

  if (!assistantText.trim()) return;

  const { data: assistantMessage } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'assistant', content: assistantText })
    .select('id')
    .single();

  if (conv.title === 'New Chat' && assistantMessage) {
    generateTitle(content)
      .then((title) => supabase.from('conversations').update({ title }).eq('id', conversationId))
      .catch(console.error);
  }
});

export default router;
