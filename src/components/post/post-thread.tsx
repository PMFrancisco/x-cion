"use client";

import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";
import { PostFeed } from "./post-feed";
import { usePosts } from "@/hooks/use-posts";
import { Separator } from "@/components/ui/separator";
import type { PostWithCounts } from "@/lib/types";

interface PostThreadProps {
  post: PostWithCounts;
}

export function PostThread({ post }: PostThreadProps) {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
  } = usePosts({ parentId: post.id });

  return (
    <div>
      <PostCard post={post} variant="detail" />
      <Separator />
      <PostComposer
        parentId={post.id}
        placeholder="Publica tu respuesta"
        compact
      />
      <Separator />
      <PostFeed
        pages={data?.pages ?? []}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        emptyMessage="Aún no hay respuestas. ¡Sé el primero en responder!"
      />
    </div>
  );
}
