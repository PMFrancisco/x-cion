"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Profile, PostWithCounts } from "@/lib/types";

const SEARCH_LIMIT = 20;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

async function searchProfiles(query: string): Promise<Profile[]> {
  const supabase = createClient();
  const pattern = `%${query}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(SEARCH_LIMIT);

  if (error) throw error;
  return data ?? [];
}

async function searchPosts(query: string, currentUserId?: string): Promise<PostWithCounts[]> {
  const supabase = createClient();
  const pattern = `%${query}%`;

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
    .ilike("content", pattern)
    .is("repost_of", null)
    .order("created_at", { ascending: false })
    .limit(SEARCH_LIMIT);

  if (error) throw error;

  type PostRow = Record<string, unknown> & {
    id: string;
    author_id: string;
    content: string;
    media_urls: string[];
    parent_id: string | null;
    repost_of: string | null;
    created_at: string;
    updated_at: string;
    author: Profile;
    likes?: { user_id: string }[];
    bookmarks?: { user_id: string }[];
  };

  const rows = (data ?? []) as PostRow[];
  const postIds = rows.map((p) => p.id);

  const replyCounts: Record<string, number> = {};
  const repostCounts: Record<string, number> = {};

  if (postIds.length > 0) {
    const { data: replies } = await supabase
      .from("posts")
      .select("parent_id")
      .in("parent_id", postIds);

    (replies ?? []).forEach((r: { parent_id: string | null }) => {
      if (r.parent_id) {
        replyCounts[r.parent_id] = (replyCounts[r.parent_id] ?? 0) + 1;
      }
    });

    const { data: reposts } = await supabase
      .from("posts")
      .select("repost_of")
      .in("repost_of", postIds);

    (reposts ?? []).forEach((r: { repost_of: string | null }) => {
      if (r.repost_of) {
        repostCounts[r.repost_of] = (repostCounts[r.repost_of] ?? 0) + 1;
      }
    });
  }

  return rows.map((post) => ({
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
  }));
}

export function useSearchProfiles(query: string) {
  const debouncedQuery = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: ["search", "profiles", debouncedQuery],
    queryFn: () => searchProfiles(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
  });
}

export function useSearchPosts(query: string) {
  const { user } = useAuth();
  const debouncedQuery = useDebounce(query.trim(), 300);

  return useQuery({
    queryKey: ["search", "posts", debouncedQuery, user?.id],
    queryFn: () => searchPosts(debouncedQuery, user?.id),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
  });
}
