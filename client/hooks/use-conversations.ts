import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-utils';

export type Conversation = {
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
    onError: (err) => {
      toast.error(getErrorMessage(err));
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
    onError: (err) => {
      toast.error(getErrorMessage(err));
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
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });
}
