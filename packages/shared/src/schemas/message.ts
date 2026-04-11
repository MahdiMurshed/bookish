import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message is too long'),
});

export type SendMessageFormValues = z.infer<typeof sendMessageSchema>;
