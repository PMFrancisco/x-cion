"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { enrichPosts, type RawPost } from "@/lib/post-helpers";
import type { PostWithCounts } from "@/lib/types";

const PAGE_SIZE = 20;

interface FetchPostsOptions {
  feedType?: "home" | "explore" | "user" | "replies" | "likes" | "bookmarks";
  userId?: string;
  parentId?: string;
  currentUserId?: string;
}

async function fetchPosts({
  pageParam,
  feedType = "explore",
  userId,
  parentId,
  currentUserId,
}: FetchPostsOptions & { pageParam?: string }) {
  const supabase = createClient();

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!author_id(*),
      likes(user_id),
      bookmarks(user_id)
    `
    )
    .is("repost_of", null)
    .order("created_at", { ascending: !!parentId })
    .limit(PAGE_SIZE);

  if (pageParam) {
    query = parentId ? query.gt("created_at", pageParam) : query.lt("created_at", pageParam);
  }

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else if (feedType === "home" || feedType === "explore" || feedType === "user") {
    query = query.is("parent_id", null);
  }

  if (feedType === "home" && currentUserId) {
    const { data: following } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    const followingIds = following?.map((f: { following_id: string }) => f.following_id) ?? [];
    followingIds.push(currentUserId);

    if (followingIds.length > 0) {
      query = query.in("author_id", followingIds);
    }
  } else if (feedType === "user" && userId) {
    query = query.eq("author_id", userId);
  } else if (feedType === "replies" && userId) {
    query = query.eq("author_id", userId).not("parent_id", "is", null);
  } else if (feedType === "likes" && userId) {
    const { data: likedPosts } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", userId);
    const postIds = likedPosts?.map((l: { post_id: string }) => l.post_id) ?? [];
    if (postIds.length === 0) return { data: [], nextCursor: null };
    query = query.in("id", postIds);
  } else if (feedType === "bookmarks" && currentUserId) {
    const { data: bookmarkedPosts } = await supabase
      .from("bookmarks")
      .select("post_id")
      .eq("user_id", currentUserId);
    const postIds = bookmarkedPosts?.map((b: { post_id: string }) => b.post_id) ?? [];
    if (postIds.length === 0) return { data: [], nextCursor: null };
    query = query.in("id", postIds).is("parent_id", null);
  }

  const { data, error } = await query;

  if (error) throw error;

  const rows = (data ?? []) as RawPost[];
  const posts: PostWithCounts[] = await enrichPosts(rows, currentUserId);

  return {
    data: posts,
    nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].created_at : null,
  };
}

export function usePosts(options: Omit<FetchPostsOptions, "currentUserId"> = {}) {
  const { effectiveProfileId, isLoading: authLoading } = useAuth();

  return useInfiniteQuery({
    queryKey: ["posts", options, effectiveProfileId],
    queryFn: ({ pageParam }) =>
      fetchPosts({ ...options, pageParam, currentUserId: effectiveProfileId }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !authLoading,
    retry: 2,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { effectiveProfileId } = useAuth();

  return useMutation({
    mutationFn: async ({
      content,
      mediaUrls = [],
      parentId,
    }: {
      content: string;
      mediaUrls?: string[];
      parentId?: string;
    }) => {
      if (!effectiveProfileId) throw new Error("Not authenticated");
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: effectiveProfileId,
          content,
          media_urls: mediaUrls,
          parent_id: parentId || null,
        })
        .select("*, author:profiles!author_id(*)")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { parentId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Si es respuesta, actualizar el hilo del post padre (contador de replies)
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ["post", parentId] });
      }
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Limpiar la vista de hilo del post eliminado
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("posts")
        .update({ content })
        .eq("id", postId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      // Actualizar la vista de hilo con el contenido editado
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
