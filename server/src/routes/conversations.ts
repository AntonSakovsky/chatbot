import { Router, Response } from 'express';
import { supabase } from '../services/supabase';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, created_at, updated_at')
    .eq('user_id', req.userId!)
    .order('updated_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: req.userId!, title: 'New Chat' })
    .select('id, title, created_at, updated_at')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(data);
});

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { title } = req.body;
  const { id } = req.params;

  const { data, error } = await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id)
    .eq('user_id', req.userId!)
    .select('id, title, updated_at')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Conversation not found' });
    return;
  }
  res.json(data);
});

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', req.userId!);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(204).send();
});

export default router;
