import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  res.json({ id: req.userId, email: req.userEmail });
});

export default router;
