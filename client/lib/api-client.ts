import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 15_000;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb-access-token');
}

function getAnonToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('anon_token');
}

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: REQUEST_TIMEOUT_MS,
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  const anonToken = getAnonToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  if (anonToken) config.headers['X-Anon-Token'] = anonToken;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; code?: string }>) => {
    const message = err.response?.data?.error || err.message || 'Request failed';
    const code = err.response?.data?.code;
    const status = err.response?.status;

    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sb-access-token');
      }
    }

    return Promise.reject(Object.assign(new Error(message), { status, code }));
  }
);

export async function uploadFile(file: File): Promise<{ id: string; file_name: string; mime_type: string; url: string | null }> {
  const form = new FormData();
  form.append('file', file);

  const { data } = await apiClient.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60_000, // uploads need more time
  });
  return data;
}

export async function streamPost(
  path: string,
  body: unknown,
  externalSignal?: AbortSignal
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const token = getToken();
  const anonToken = getAnonToken();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (anonToken) headers['X-Anon-Token'] = anonToken;

  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), 120_000); // 2 min for streaming

  const signal = externalSignal
    ? AbortSignal.any([timeoutController.signal, externalSignal])
    : timeoutController.signal;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      if (externalSignal?.aborted) throw err; // user-initiated cancel — re-throw as AbortError
      throw Object.assign(new Error('Request timed out. Please try again.'), { status: 408 });
    }
    throw Object.assign(new Error('Network error. Please check your connection.'), { status: 0 });
  }

  clearTimeout(timeout);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Stream failed'), {
      status: res.status,
      code: err.code,
    });
  }

  return res.body!.getReader();
}
