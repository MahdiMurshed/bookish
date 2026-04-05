import type { BookFilters, CreateBookInput, UpdateBookInput } from '@repo/api-client';
import {
  createBook,
  deleteBook,
  getAvailableBooks,
  getBook,
  getUserBooks,
  updateBook,
} from '@repo/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const bookKeys = {
  all: ['books'] as const,
  lists: () => [...bookKeys.all, 'list'] as const,
  list: (userId: string) => [...bookKeys.lists(), userId] as const,
  available: (filters?: Omit<BookFilters, 'is_lendable'>) =>
    [...bookKeys.all, 'available', filters] as const,
  details: () => [...bookKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
};

export function useBooks(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? bookKeys.list(userId) : ['books', 'list', 'none'],
    queryFn: () => getUserBooks(userId!),
    enabled: !!userId,
  });
}

export function useAvailableBooks(filters?: Omit<BookFilters, 'is_lendable'>) {
  return useQuery({
    queryKey: bookKeys.available(filters),
    queryFn: () => getAvailableBooks(filters),
  });
}

export function useBookDetail(id: string | undefined) {
  return useQuery({
    queryKey: id ? bookKeys.detail(id) : ['books', 'detail', 'none'],
    queryFn: () => getBook(id!),
    enabled: !!id,
  });
}

export function useCreateBook(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookInput) => createBook(input),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: bookKeys.list(userId) });
      }
      queryClient.invalidateQueries({ queryKey: [...bookKeys.all, 'available'] });
    },
  });
}

export function useUpdateBook(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookInput }) => updateBook(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookKeys.detail(variables.id) });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: bookKeys.list(userId) });
      }
      queryClient.invalidateQueries({ queryKey: [...bookKeys.all, 'available'] });
    },
  });
}

export function useDeleteBook(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    onSuccess: (_, id) => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: bookKeys.list(userId) });
      }
      queryClient.removeQueries({ queryKey: bookKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...bookKeys.all, 'available'] });
    },
  });
}
