"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PostThread } from "@/components/post/post-thread";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PostWithCounts } from "@/lib/types";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
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

      const p: any = data;
      return {
        ...p,
        author: p.author,
        like_count: p.likes?.length ?? 0,
        reply_count: replyCount ?? 0,
        repost_count: repostCount ?? 0,
        is_liked:
          p.likes?.some((l: any) => l.user_id === user?.id) ?? false,
        is_bookmarked:
          p.bookmarks?.some((b: any) => b.user_id === user?.id) ?? false,
        is_reposted: false,
      } as PostWithCounts;
    },
  });

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#1d9bf0]" />
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
      <div className="sticky top-0 z-10 flex items-center gap-6 backdrop-blur-md bg-background/80 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Post</h1>
      </div>

      <PostThread post={post} />
    </div>
  );
}
