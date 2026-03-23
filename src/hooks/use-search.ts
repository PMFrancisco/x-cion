"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { enrichPosts, type RawPost } from "@/lib/post-helpers";
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

  const rows = (data ?? []) as RawPost[];
  return enrichPosts(rows, currentUserId);
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

async function searchMentions(query: string): Promise<Profile[]> {
  const supabase = createClient();
  const pattern = `${query}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .or(`username.ilike.${pattern},display_name.ilike.%${query}%`)
    .limit(5);

  if (error) throw error;
  return data ?? [];
}

export function useMentionSuggestions(query: string | null) {
  const debouncedQuery = useDebounce(query?.trim() ?? "", 150);

  return useQuery({
    queryKey: ["mentions", debouncedQuery],
    queryFn: () => searchMentions(debouncedQuery),
    enabled: debouncedQuery.length >= 1,
    staleTime: 30_000,
  });
}
