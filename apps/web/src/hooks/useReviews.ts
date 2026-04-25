import type { CreateReviewInput } from '@repo/api-client';
import {
  createReview,
  getMyReviewForRequest,
  getReviewsByReviewer,
  getReviewsForBook,
} from '@repo/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const reviewKeys = {
  all: ['reviews'] as const,
  forBook: (bookId: string) => [...reviewKeys.all, 'forBook', bookId] as const,
  myForRequest: (requestId: string) => [...reviewKeys.all, 'myForRequest', requestId] as const,
  byReviewer: (userId: string) => [...reviewKeys.all, 'byReviewer', userId] as const,
};

export function useReviewsForBook(bookId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.forBook(bookId ?? ''),
    queryFn: () => getReviewsForBook(bookId!),
    enabled: !!bookId,
  });
}

export function useMyReviewForRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.myForRequest(requestId ?? ''),
    queryFn: () => getMyReviewForRequest(requestId!),
    enabled: !!requestId,
  });
}

export function useReviewsByReviewer(userId: string | undefined) {
  return useQuery({
    queryKey: reviewKeys.byReviewer(userId ?? ''),
    queryFn: () => getReviewsByReviewer(userId!),
    enabled: !!userId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.forBook(variables.book_id) });
      queryClient.invalidateQueries({
        queryKey: reviewKeys.myForRequest(variables.borrow_request_id),
      });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
