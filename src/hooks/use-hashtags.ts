"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { enrichPosts, type RawPost } from "@/lib/post-helpers";
import type { PostWithCounts } from "@/lib/types";

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

  const rows = (data ?? []) as RawPost[];
  const posts: PostWithCounts[] = await enrichPosts(rows, currentUserId);

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
    retry: 2,
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
