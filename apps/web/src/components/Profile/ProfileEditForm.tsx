import { zodResolver } from '@hookform/resolvers/zod';
import { type UpdateUserFormValues, updateUserSchema } from '@repo/shared';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { Textarea } from '@repo/ui/components/textarea';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface ProfileEditFormProps {
  defaultValues: UpdateUserFormValues;
  onSubmit: (values: UpdateUserFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ProfileEditForm({
  defaultValues,
  onSubmit,
  onCancel,
  loading,
}: ProfileEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues,
  });

  const submit = async (values: UpdateUserFormValues) => {
    try {
      await onSubmit(values);
      toast.success('Profile updated.');
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Please try again.';
      toast.error(`Couldn't save your profile. ${detail}`);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submit)}>
      <div className="space-y-1">
        <Label htmlFor="profile-display-name">Display name</Label>
        <Input
          id="profile-display-name"
          autoComplete="off"
          disabled={loading}
          {...register('display_name')}
        />
        {errors.display_name && (
          <p className="text-destructive text-xs">{errors.display_name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="profile-bio">
          Bio <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="profile-bio"
          rows={3}
          placeholder="A line or two about what you read."
          disabled={loading}
          {...register('bio')}
        />
        {errors.bio && <p className="text-destructive text-xs">{errors.bio.message}</p>}
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
