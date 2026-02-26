"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useIsFollowing(targetUserId: string) {
  const { user, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["following", targetUserId, user?.id],
    queryFn: async () => {
      if (!user) return false;
      const supabase = createClient();

      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      return !!data;
    },
    enabled: !!targetUserId && !authLoading,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      isFollowing,
    }: {
      targetUserId: string;
      isFollowing: boolean;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const supabase = createClient();

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("follows")
          .insert({
            follower_id: user.id,
            following_id: targetUserId,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { targetUserId }) => {
      queryClient.invalidateQueries({
        queryKey: ["following", targetUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useFollowCounts(userId: string) {
  return useQuery({
    queryKey: ["follow-counts", userId],
    queryFn: async () => {
      const supabase = createClient();

      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      return {
        followers: followers ?? 0,
        following: following ?? 0,
      };
    },
    enabled: !!userId,
  });
}
