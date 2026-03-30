import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import conversationsRouter from './routes/conversations';
import messagesRouter from './routes/messages';
import uploadRouter from './routes/upload';
import anonymousRouter from './routes/anonymous';
import authRouter from './routes/auth';
import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
}));

app.use('/api/anonymous/chat', rateLimit({
  windowMs: 60 * 1000,
  max: 5,
}));

app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/api/auth', authRouter);
app.use('/api/conversations', conversationsRouter);
app.use('/api/conversations/:id/messages', messagesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/anonymous', anonymousRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
