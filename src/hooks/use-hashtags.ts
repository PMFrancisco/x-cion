"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Post, Profile, PostWithCounts } from "@/lib/types";

const PAGE_SIZE = 20;

async function fetchHashtagPosts({
  tag,
  pageParam,
  currentUserId,
}: {
  tag: string;
  pageParam?: string;
  currentUserId?: string;
}) {
  const supabase = createClient();

  const { data: hashtagRow } = await supabase
    .from("hashtags")
    .select("id")
    .eq("name", tag.toLowerCase())
    .single();

  if (!hashtagRow) return { data: [], nextCursor: null };

  let phQuery = supabase
    .from("post_hashtags")
    .select("post_id")
    .eq("hashtag_id", hashtagRow.id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (pageParam) {
    phQuery = phQuery.lt("created_at", pageParam);
  }

  const { data: phRows, error: phError } = await phQuery;
  if (phError) throw phError;

  const postIds = (phRows ?? []).map((r: { post_id: string }) => r.post_id);
  if (postIds.length === 0) return { data: [], nextCursor: null };

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!author_id(*),
      likes(user_id),
      bookmarks(user_id)
    `
    )
    .in("id", postIds)
    .is("repost_of", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  type RawPost = Post & {
    author: Profile;
    likes?: { user_id: string }[];
    bookmarks?: { user_id: string }[];
  };

  const rows = (data ?? []) as RawPost[];
  const ids = rows.map((p) => p.id);

  const replyCounts: Record<string, number> = {};
  const repostCounts: Record<string, number> = {};
  const userReplied: Set<string> = new Set();

  if (ids.length > 0) {
    const { data: replies } = await supabase
      .from("posts")
      .select("parent_id, author_id")
      .in("parent_id", ids);

    (replies ?? []).forEach((r: { parent_id: string | null; author_id: string }) => {
      if (r.parent_id) {
        replyCounts[r.parent_id] = (replyCounts[r.parent_id] ?? 0) + 1;
        if (r.author_id === currentUserId) userReplied.add(r.parent_id);
      }
    });

    const { data: reposts } = await supabase.from("posts").select("repost_of").in("repost_of", ids);

    (reposts ?? []).forEach((r: { repost_of: string | null }) => {
      if (r.repost_of) repostCounts[r.repost_of] = (repostCounts[r.repost_of] ?? 0) + 1;
    });
  }

  const posts: PostWithCounts[] = rows.map((post) => ({
    id: post.id,
    author_id: post.author_id,
    content: post.content,
    media_urls: post.media_urls,
    parent_id: post.parent_id,
    repost_of: post.repost_of,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author: post.author,
    like_count: post.likes?.length ?? 0,
    reply_count: replyCounts[post.id] ?? 0,
    repost_count: repostCounts[post.id] ?? 0,
    is_liked: post.likes?.some((l) => l.user_id === currentUserId) ?? false,
    is_bookmarked: post.bookmarks?.some((b) => b.user_id === currentUserId) ?? false,
    is_reposted: false,
    is_replied: userReplied.has(post.id),
  }));

  return {
    data: posts,
    nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].created_at : null,
  };
}

export function useHashtagPosts(tag: string) {
  const { effectiveProfileId, isLoading: authLoading } = useAuth();

  return useInfiniteQuery({
    queryKey: ["posts", "hashtag", tag.toLowerCase(), effectiveProfileId],
    queryFn: ({ pageParam }) =>
      fetchHashtagPosts({ tag, pageParam, currentUserId: effectiveProfileId }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    enabled: !authLoading && tag.length > 0,
    retry: 1,
  });
}

export interface TrendingHashtag {
  name: string;
  post_count: number;
}

async function fetchTrendingHashtags(hours = 24, limit = 5): Promise<TrendingHashtag[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("trending_hashtags", {
    hours,
    lim: limit,
  });

  if (error) throw error;
  return (data ?? []) as TrendingHashtag[];
}

export function useTrendingHashtags(hours = 24, limit = 5) {
  return useQuery({
    queryKey: ["trending-hashtags", hours, limit],
    queryFn: () => fetchTrendingHashtags(hours, limit),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}
