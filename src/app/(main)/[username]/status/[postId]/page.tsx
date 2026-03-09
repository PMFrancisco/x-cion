"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PostThread } from "@/components/post/post-thread";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import type { Post, Profile, PostWithCounts } from "@/lib/types";

export default function PostPage() {
  const params = useParams();
  const postId = params.postId as string;
  const { user, isLoading: authLoading } = useAuth();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId, user?.id],
    retry: 1,
    enabled: !authLoading,
    queryFn: async () => {
      const supabase = createClient();

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
        .eq("id", postId)
        .single();

      if (error) throw error;

      const { count: replyCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("parent_id", postId);

      const { count: repostCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("repost_of", postId);

      const p = data as Post & {
        author: Profile;
        likes?: { user_id: string }[];
        bookmarks?: { user_id: string }[];
      };
      return {
        ...p,
        author: p.author,
        like_count: p.likes?.length ?? 0,
        reply_count: replyCount ?? 0,
        repost_count: repostCount ?? 0,
        is_liked: p.likes?.some((l) => l.user_id === user?.id) ?? false,
        is_bookmarked: p.bookmarks?.some((b) => b.user_id === user?.id) ?? false,
        is_reposted: false,
      } as PostWithCounts;
    },
  });

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-xcion-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-bold">Post not found</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Post" backButton />

      <PostThread post={post} />
    </div>
  );
}
