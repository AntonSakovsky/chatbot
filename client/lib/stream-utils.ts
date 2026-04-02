export async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onDelta: (text: string) => void,
  abortSignal?: AbortSignal
): Promise<{ fullText: string; userAborted: boolean }> {
  const decoder = new TextDecoder();
  let fullText = '';
  let userAborted = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (abortSignal?.aborted) {
          userAborted = true;
          break;
        }
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') break;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.delta) {
            fullText += parsed.delta;
            onDelta(fullText);
          }
        } catch (parseErr) {
          if (!(parseErr instanceof SyntaxError)) throw parseErr;
        }
      }
    }
  } catch (readErr: unknown) {
    if (readErr instanceof Error && readErr.name === 'AbortError') {
      userAborted = true;
    } else {
      throw readErr;
    }
  }

  return { fullText, userAborted };
}
