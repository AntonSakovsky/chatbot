import { v4 as uuidv4 } from 'uuid';

export function getOrCreateAnonToken(): string {
  let token = localStorage.getItem('anon_token');
  if (!token) {
    token = uuidv4();
    localStorage.setItem('anon_token', token);
  }
  return token;
}
