import { z } from 'zod';

// Profile edit form. Email is immutable (auth-managed) and the avatar pattern
// in this app is deterministic initials-on-palette, so neither field appears
// here. Bio is optional but capped at one tweet's worth.
export const updateUserSchema = z.object({
  display_name: z.string().trim().min(1, 'Name is required').max(80, 'Keep it under 80 characters'),
  bio: z
    .string()
    .trim()
    .max(280, 'Keep your bio under 280 characters')
    .optional()
    .or(z.literal('')),
});

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
