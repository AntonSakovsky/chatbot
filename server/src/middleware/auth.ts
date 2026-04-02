import { NextFunction, Request, Response } from 'express';
import { supabase } from '../services/supabase';

export type AuthRequest = Request & {
  userId?: string;
  userEmail?: string;
};

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  req.userId = data.user.id;
  req.userEmail = data.user.email;
  next();
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  supabase.auth
    .getUser(token)
    .then(({ data }) => {
      if (data.user) {
        req.userId = data.user.id;
        req.userEmail = data.user.email;
      }
      next();
    })
    .catch(() => next());
}
