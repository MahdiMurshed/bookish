import { zodResolver } from '@hookform/resolvers/zod';
import { type SendMessageFormValues, sendMessageSchema } from '@repo/shared';
import { Button } from '@repo/ui/components/button';
import { Textarea } from '@repo/ui/components/textarea';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { useSendMessage } from '@/hooks/useMessages';

interface ComposerProps {
  threadId: string;
  counterpartyName: string;
}

export function Composer({ threadId, counterpartyName }: ComposerProps) {
  const send = useSendMessage(threadId);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SendMessageFormValues>({
    resolver: zodResolver(sendMessageSchema),
    defaultValues: { content: '' },
    mode: 'onChange',
  });

  const draft = watch('content') ?? '';
  const isEmpty = draft.trim().length === 0;
  const disabled = isEmpty || isSubmitting || send.isPending;

  const onSubmit = (data: SendMessageFormValues) => {
    send.mutate(data.content, { onSuccess: () => reset({ content: '' }) });
  };

  const { ref: contentRef, ...contentRegister } = register('content');

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex items-end gap-2.5 border-t bg-card px-4 py-3"
    >
      <div className="flex-1 space-y-1">
        <Textarea
          {...contentRegister}
          ref={contentRef}
          placeholder={`Message ${counterpartyName}…`}
          rows={1}
          maxLength={2000}
          disabled={send.isPending}
          className="max-h-[120px] min-h-[40px] resize-none rounded-[20px] px-3.5 py-2.5"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (!disabled) handleSubmit(onSubmit)();
            }
          }}
        />
        {errors.content && (
          <p className="px-1 text-destructive text-xs">{errors.content.message}</p>
        )}
        {send.error && (
          <p className="px-1 text-destructive text-xs">
            {send.error instanceof Error ? send.error.message : 'Failed to send message'}
          </p>
        )}
      </div>

      <Button type="submit" disabled={disabled} className="h-10 rounded-[20px] px-[18px]">
        <Send className="h-4 w-4" aria-hidden="true" />
        Send
      </Button>
    </form>
  );
}
