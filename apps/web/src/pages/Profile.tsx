import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { ProfileEditForm } from '@/components/Profile/ProfileEditForm';
import { ProfileStats } from '@/components/Profile/ProfileStats';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateUser, useUserProfile, useUserStats } from '@/hooks/useUser';
import { initialsFor } from '@/lib/avatarPalette';

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const { data: stats, isLoading: statsLoading } = useUserStats(user?.id);
  const updateUser = useUpdateUser(user?.id);
  const [editing, setEditing] = useState(false);

  if (profileLoading) {
    return <div className="text-center text-muted-foreground">Loading profile…</div>;
  }

  if (!profile) {
    return <div className="text-center text-destructive">Profile not found.</div>;
  }

  const name = profile.display_name || profile.email;
  const initials = initialsFor(profile.display_name, profile.email);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-lg text-primary"
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="break-words font-bold text-2xl">{name}</h1>
            <p className="break-all text-muted-foreground text-sm">{profile.email}</p>
            {profile.bio && !editing && (
              <p className="pt-2 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            )}
          </div>

          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              className="self-start"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
          )}
        </div>

        {editing && (
          <div className="mt-6 border-t pt-6">
            <ProfileEditForm
              defaultValues={{
                display_name: profile.display_name ?? '',
                bio: profile.bio ?? '',
              }}
              onSubmit={async (values) => {
                await updateUser.mutateAsync({
                  display_name: values.display_name,
                  bio: values.bio || null,
                });
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
              loading={updateUser.isPending}
            />
          </div>
        )}
      </Card>

      <ProfileStats stats={stats} loading={statsLoading} />
    </div>
  );
}
