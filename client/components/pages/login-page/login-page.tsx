'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';

type Tab = 'signin' | 'signup';

export function LoginPage() {
  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'signin') {
        await signInWithEmail(email, password);
        router.push('/chat');
      } else {
        await signUpWithEmail(email, password);
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
          <span className="text-primary-foreground text-xl font-bold">C</span>
        </div>
        <h1 className="text-2xl font-semibold">ChatBot</h1>
        <p className="text-sm text-muted-foreground mt-1">Your AI assistant</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex rounded-lg bg-muted p-1 mb-6">
          {(['signin', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Loading…' : tab === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-6">
        Up to 3 free questions without an account
      </p>
    </div>
  );
}
