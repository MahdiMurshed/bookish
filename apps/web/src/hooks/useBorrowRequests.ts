import type {
  ApproveBorrowRequestInput,
  CreateBorrowRequestInput,
  HandOverInput,
} from '@repo/api-client';
import {
  approveBorrowRequest,
  cancelBorrowRequest,
  createBorrowRequest,
  denyBorrowRequest,
  getActiveRequestForBook,
  getIncomingRequests,
  getOutgoingRequests,
  handOverBook,
  markReturned,
} from '@repo/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const borrowRequestKeys = {
  all: ['borrowRequests'] as const,
  incoming: () => [...borrowRequestKeys.all, 'incoming'] as const,
  outgoing: () => [...borrowRequestKeys.all, 'outgoing'] as const,
  activeForBook: (bookId: string) => [...borrowRequestKeys.all, 'active', bookId] as const,
};

export function useIncomingRequests() {
  return useQuery({
    queryKey: borrowRequestKeys.incoming(),
    queryFn: getIncomingRequests,
  });
}

export function useOutgoingRequests() {
  return useQuery({
    queryKey: borrowRequestKeys.outgoing(),
    queryFn: getOutgoingRequests,
  });
}

export function useActiveRequestForBook(bookId: string | undefined) {
  return useQuery({
    queryKey: bookId
      ? borrowRequestKeys.activeForBook(bookId)
      : ['borrowRequests', 'active', 'none'],
    queryFn: () => getActiveRequestForBook(bookId!),
    enabled: !!bookId,
  });
}

export function useCreateBorrowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBorrowRequestInput) => createBorrowRequest(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: borrowRequestKeys.outgoing() });
      queryClient.invalidateQueries({
        queryKey: borrowRequestKeys.activeForBook(variables.book_id),
      });
    },
  });
}

export function useApproveBorrowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: ApproveBorrowRequestInput }) =>
      approveBorrowRequest(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: borrowRequestKeys.all });
    },
  });
}

export function useDenyBorrowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      denyBorrowRequest(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: borrowRequestKeys.all });
    },
  });
}

export function useCancelBorrowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cancelBorrowRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: borrowRequestKeys.all });
    },
  });
}

export function useHandOverBook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input?: HandOverInput }) => handOverBook(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: borrowRequestKeys.all });
    },
  });
}

export function useMarkReturned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => markReturned(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: borrowRequestKeys.all });
    },
  });
}
