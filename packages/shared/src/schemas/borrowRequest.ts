import { z } from 'zod';

// Full payload sent to the API. book_id is injected from the page context
// (URL param), not from a form field.
export const createBorrowRequestSchema = z.object({
  book_id: z.string().uuid(),
  message: z.string().max(500).optional(),
  due_date: z.string().optional(),
});

// Subset the form actually collects. Using the full schema as the form
// resolver silently fails validation because book_id is never registered,
// which made "Send Request" a no-op with no visible error.
export const borrowRequestFormSchema = createBorrowRequestSchema.omit({ book_id: true });

export type CreateBorrowRequestFormValues = z.infer<typeof borrowRequestFormSchema>;
