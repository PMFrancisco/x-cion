"use client";

import { PostFeed } from "@/components/post/post-feed";
import { usePosts } from "@/hooks/use-posts";

export default function ExplorePage() {
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
  } = usePosts({ feedType: "explore" });

  return (
    <div>
      <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b">
        <h1 className="px-4 py-3 text-xl font-bold">Explorar</h1>
      </div>

      <PostFeed
        pages={data?.pages ?? []}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        emptyMessage="Aún no hay publicaciones. ¡Sé el primero en publicar!"
      />
    </div>
  );
}
