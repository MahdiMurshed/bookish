import { z } from 'zod';

// Full payload sent to the API. book_id and borrow_request_id are derived
// from the page context (the request being reviewed), not collected by the
// form — same split-schema pattern as borrowRequest.
export const createReviewSchema = z.object({
  book_id: z.string().uuid(),
  borrow_request_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const reviewFormSchema = createReviewSchema.omit({
  book_id: true,
  borrow_request_id: true,
});

export type CreateReviewFormValues = z.infer<typeof reviewFormSchema>;
