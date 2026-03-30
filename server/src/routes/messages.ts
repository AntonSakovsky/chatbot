import { Router, Response } from 'express';
import { supabase } from '../services/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { streamGeminiResponse, generateTitle, ConversationMessage } from '../services/llm';
import { getFileAsBase64 } from '../services/storage';

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

  // Fetch attachments they exist
  let attachments: any[] = [];
  if (attachmentIds.length > 0) {
    const { data } = await supabase
      .from('attachments')
      .select('id, file_name, storage_path, mime_type, extracted_text')
      .in('id', attachmentIds);
    attachments = data ?? [];
  }

  // Save user message
  const { data: userMessage, error: insertError } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'user', content })
    .select('id')
    .single();

  if (insertError) {
    res.status(500).json({ error: insertError.message });
    return;
  }

  // Link attachments to message
  if (attachments.length > 0) {
    await supabase
      .from('attachments')
      .update({ message_id: userMessage.id })
      .in('id', attachmentIds);
  }

  // Load conversation history for context
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50);

  const geminiHistory: ConversationMessage[] = (history ?? [])
    .slice(0, -1) // exclude the message just inserted
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

  // Build user parts for Gemini
  const userParts: any[] = [];

  // Add document context
  for (const att of attachments) {
    if (att.extracted_text) {
      userParts.push({
        type: 'text',
        text: `[Document: ${att.file_name}]\n${att.extracted_text}\n`,
      });
    } else if (att.mime_type.startsWith('image/')) {
      const base64 = await getFileAsBase64(att.storage_path);
      userParts.push({ type: 'image', mimeType: att.mime_type, data: base64 });
    }
  }

  userParts.push({ type: 'text', text: content });

  const assistantText = await streamGeminiResponse(userParts, geminiHistory, res);

  // Save assistant message (after stream ends)
  const { data: assistantMessage } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role: 'assistant', content: assistantText })
    .select('id')
    .single();

  // Auto-generate title on first exchange
  if (conv.title === 'New Chat' && assistantMessage) {
    generateTitle(content).then((title) => {
      supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId)
        .then(() => {});
    });
  }
});

export default router;
