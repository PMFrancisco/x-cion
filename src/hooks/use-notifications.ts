"use client";

import { useEffect } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Notification, Profile, Post } from "@/lib/types";

const PAGE_SIZE = 20;

type NotificationRow = Notification & {
  actor: Profile;
  post: Post | null;
};

async function fetchNotifications({ pageParam, userId }: { pageParam?: string; userId: string }) {
  const supabase = createClient();

  let query = supabase
    .from("notifications")
    .select(
      `
      *,
      actor:profiles!actor_id(*),
      post:posts!post_id(*)
    `
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (pageParam) {
    query = query.lt("created_at", pageParam);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []) as NotificationRow[];

  return {
    data: rows,
    nextCursor: rows.length === PAGE_SIZE ? rows[rows.length - 1].created_at : null,
  };
}

export function useNotifications() {
  const { effectiveProfileId, isLoading: authLoading } = useAuth();

  return useInfiniteQuery({
    queryKey: ["notifications", effectiveProfileId],
    queryFn: ({ pageParam }) => fetchNotifications({ pageParam, userId: effectiveProfileId! }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !authLoading && !!effectiveProfileId,
    retry: 1,
  });
}

export function useUnreadCount() {
  const { effectiveProfileId, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["unread-count", effectiveProfileId],
    queryFn: async () => {
      if (!effectiveProfileId) return 0;
      const supabase = createClient();

      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", effectiveProfileId)
        .eq("read", false);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !authLoading && !!effectiveProfileId,
    staleTime: 10_000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  const { effectiveProfileId } = useAuth();

  return useMutation({
    mutationFn: async (notificationId?: string) => {
      if (!effectiveProfileId) throw new Error("Not authenticated");
      const supabase = createClient();

      let query = supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_id", effectiveProfileId)
        .eq("read", false);

      if (notificationId) {
        query = query.eq("id", notificationId);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const { effectiveProfileId } = useAuth();

  useEffect(() => {
    if (!effectiveProfileId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${effectiveProfileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveProfileId, queryClient]);
}
