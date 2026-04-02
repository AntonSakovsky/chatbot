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
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || /^https:\/\/chatbot-client.*\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

app.use('/api/', rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 50,
  message: { error: 'Too many requests, please try again later.' },
}));

app.use('/api/anonymous/chat', rateLimit({
  windowMs: 60 * 1000,
  max: 50,
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


if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
