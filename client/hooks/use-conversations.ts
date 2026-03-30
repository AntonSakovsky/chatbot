import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/conversations');
      return data;
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation<Conversation, Error>({
    mutationFn: async () => {
      const { data } = await apiClient.post('/api/conversations');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await apiClient.delete(`/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useRenameConversation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string; title: string }>({
    mutationFn: async ({ id, title }) => {
      await apiClient.patch(`/api/conversations/${id}`, { title });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
