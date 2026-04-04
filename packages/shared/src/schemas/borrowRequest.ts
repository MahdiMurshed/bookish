import { z } from 'zod';

export const createBorrowRequestSchema = z.object({
  book_id: z.string().uuid(),
  message: z.string().max(500).optional(),
  due_date: z.string().optional(),
});

export type CreateBorrowRequestFormValues = z.infer<typeof createBorrowRequestSchema>;
