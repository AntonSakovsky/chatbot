'use client';

import { useAuth } from '@/hooks/use-auth';
import { AuthNewChat } from './auth-new-chat/auth-new-chat';
import { AnonChat } from './anon-chat/anon-chat';

export const NewChatPage = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <AuthNewChat /> : <AnonChat />;
};
