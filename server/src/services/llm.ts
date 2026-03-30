import { GoogleGenAI } from '@google/genai';
import { Response } from 'express';

const ai = new GoogleGenAI({});

export type ConversationMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

export type MessagePart = {
  type: 'text' | 'image' | 'document';
  text?: string;
  mimeType?: string;
  data?: string;
};

const MODEL = 'gemini-2.5-flash-lite';

export async function streamGeminiResponse(
  userParts: MessagePart[],
  history: ConversationMessage[],
  res: Response
): Promise<string> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');

  const contents = [
    ...history,
    {
      role: 'user' as const,
      parts: userParts.map((part) => {
        if (part.type === 'text') return { text: part.text! };
        return { inlineData: { mimeType: part.mimeType!, data: part.data! } };
      }),
    },
  ];

  let fullText = '';

  try {
    const stream = await ai.models.generateContentStream({
      model: MODEL,
      contents,
      config: { thinkingConfig: { thinkingBudget: 0 } },
    });

    for await (const chunk of stream) {
      const delta = chunk.text;
      if (delta) {
        fullText += delta;
        res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
    }
  } catch (err: any) {
    console.log(err);
    
    const isQuota = err?.message?.includes('429') || err?.message?.includes('quota');
    const message = isQuota
      ? 'Rate limit exceeded. Please wait a moment and try again.'
      : 'An error occurred while generating a response.';
    res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();

  return fullText;
}

export async function generateTitle(firstMessage: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Generate a short 4-5 word title for a conversation that starts with: "${firstMessage}". Reply with only the title, no quotes or punctuation.`,
    });
    return response.text?.trim() ?? 'New Chat';
  } catch {
    return 'New Chat';
  }
}
