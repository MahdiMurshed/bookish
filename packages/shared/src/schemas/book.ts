import { z } from 'zod';
import { bookConditionSchema } from '../constants.js';

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  author: z.string().min(1, 'Author is required').max(200),
  isbn: z.string().max(20).optional(),
  cover_url: z.string().url().optional().or(z.literal('')),
  genre: z.string().max(50).optional(),
  condition: bookConditionSchema.optional(),
  description: z.string().max(2000).optional(),
  google_books_id: z.string().optional(),
  is_lendable: z.boolean().default(false),
});

export type CreateBookFormValues = z.infer<typeof createBookSchema>;

export const updateBookSchema = createBookSchema.partial();
export type UpdateBookFormValues = z.infer<typeof updateBookSchema>;
