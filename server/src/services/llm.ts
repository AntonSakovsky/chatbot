import { GoogleGenerativeAI } from '@google/generative-ai';
import { Response } from 'express';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface MessagePart {
  type: 'text' | 'image' | 'document';
  text?: string;
  mimeType?: string;
  data?: string; // base64
}

export interface ConversationMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export async function streamGeminiResponse(
  userParts: MessagePart[],
  history: ConversationMessage[],
  res: Response
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const chat = model.startChat({ history });

  const contentParts: any[] = userParts.map((part) => {
    if (part.type === 'text') return { text: part.text };
    if (part.type === 'image' || part.type === 'document') {
      return { inlineData: { mimeType: part.mimeType, data: part.data } };
    }
    return { text: part.text ?? '' };
  });

  const result = await chat.sendMessageStream(contentParts);

  let fullText = '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');

  for await (const chunk of result.stream) {
    const delta = chunk.text();
    if (delta) {
      fullText += delta;
      res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();

  return fullText;
}

export async function generateTitle(firstMessage: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(
    `Generate a short 4-5 word title for a conversation that starts with: "${firstMessage}". Reply with only the title, no quotes or punctuation.`
  );
  return result.response.text().trim();
}
