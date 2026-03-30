import { Router, Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { streamGeminiResponse } from '../services/llm';

const router = Router();
const MAX_QUESTIONS = 3;

router.get('/status', async (req: Request, res: Response) => {
  const token = req.headers['x-anon-token'] as string;
  if (!token) {
    res.status(400).json({ error: 'Missing X-Anon-Token header' });
    return;
  }

  const { data } = await supabase
    .from('anonymous_sessions')
    .select('question_count')
    .eq('token', token)
    .single();

  const used = data?.question_count ?? 0;
  res.json({ remaining: Math.max(0, MAX_QUESTIONS - used), used });
});

router.post('/chat', async (req: Request, res: Response) => {
  const token = req.headers['x-anon-token'] as string;
  if (!token) {
    res.status(400).json({ error: 'Missing X-Anon-Token header' });
    return;
  }

  const { content } = req.body as { content: string };
  if (!content?.trim()) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  const { data: session } = await supabase
    .from('anonymous_sessions')
    .upsert({ token, last_active: new Date().toISOString() }, { onConflict: 'token' })
    .select('id, question_count')
    .single();

  if (!session) {
    res.status(500).json({ error: 'Session error' });
    return;
  }

  if (session.question_count >= MAX_QUESTIONS) {
    res.status(403).json({ error: 'Free question limit reached. Please sign in.', code: 'LIMIT_REACHED' });
    return;
  }

  await supabase
    .from('anonymous_sessions')
    .update({ question_count: session.question_count + 1 })
    .eq('id', session.id);

  await streamGeminiResponse([{ type: 'text', text: content }], [], res);
});

export default router;
