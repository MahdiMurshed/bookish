import {
  type CommunityStats,
  getCommunityStats,
  getUser,
  getUserStats,
  type UpdateUserInput,
  type User,
  type UserStats,
  updateUser,
} from '@repo/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const userKeys = {
  all: ['user'] as const,
  profile: (userId: string) => [...userKeys.all, 'profile', userId] as const,
  stats: (userId: string) => [...userKeys.all, 'stats', userId] as const,
  community: () => [...userKeys.all, 'community'] as const,
};

export function useUserProfile(userId: string | undefined) {
  return useQuery<User>({
    queryKey: userKeys.profile(userId ?? ''),
    queryFn: () => getUser(userId!),
    enabled: !!userId,
  });
}

export function useUserStats(userId: string | undefined) {
  return useQuery<UserStats>({
    queryKey: userKeys.stats(userId ?? ''),
    queryFn: () => getUserStats(userId!),
    enabled: !!userId,
  });
}

export function useCommunityStats() {
  return useQuery<CommunityStats>({
    queryKey: userKeys.community(),
    queryFn: getCommunityStats,
  });
}

export function useUpdateUser(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) => {
      if (!userId) throw new Error('Not authenticated');
      return updateUser(userId, input);
    },
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: userKeys.profile(userId) });
      }
    },
  });
}
