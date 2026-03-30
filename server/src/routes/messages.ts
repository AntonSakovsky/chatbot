import { Response, Router } from 'express';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { ConversationMessage, generateTitle, streamGeminiResponse } from '../services/llm';
import { getFileAsBase64 } from '../services/storage';
import { supabase } from '../services/supabase';

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
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
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

  let attachments: any[] = [];
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
    res.status(500).json({ error: insertError.message });
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

  const userParts: any[] = [];

  for (const att of attachments) {
    if (att.extracted_text) {
      userParts.push({ type: 'text', text: `[Document: ${att.file_name}]\n${att.extracted_text}\n` });
    } else if (att.mime_type.startsWith('image/')) {
      const base64 = await getFileAsBase64(att.storage_path);
      userParts.push({ type: 'image', mimeType: att.mime_type, data: base64 });
    }
  }

  userParts.push({ type: 'text', text: content });

  const assistantText = await streamGeminiResponse(userParts, conversationHistory, res);

  const { data: assistantMessage } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'assistant', content: assistantText })
    .select('id')
    .single();

  if (conv.title === 'New Chat' && assistantMessage) {
    generateTitle(content).then((title) => {
      supabase.from('conversations').update({ title }).eq('id', conversationId).then(() => {});
    });
  }
});

export default router;
