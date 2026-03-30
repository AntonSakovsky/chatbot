import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    return Promise.reject(Object.assign(new Error(message), { status, code }));
  }
);

export async function uploadFile(file: File): Promise<{ id: string; file_name: string; mime_type: string }> {
  const form = new FormData();
  form.append('file', file);

  const { data } = await apiClient.post('/api/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function streamPost(
  path: string,
  body: unknown
): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const token = getToken();
  const anonToken = getAnonToken();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (anonToken) headers['X-Anon-Token'] = anonToken;

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Stream failed'), {
      status: res.status,
      code: err.code,
    });
  }

  return res.body!.getReader();
}
