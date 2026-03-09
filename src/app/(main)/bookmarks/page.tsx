"use client";

import { PostFeed } from "@/components/post/post-feed";
import { usePosts } from "@/hooks/use-posts";
import { PageHeader } from "@/components/layout/page-header";

export default function BookmarksPage() {
  const { data, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } = usePosts({
    feedType: "bookmarks",
  });

  return (
    <div>
      <PageHeader title="Guardados" />

      <PostFeed
        pages={data?.pages ?? []}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        emptyMessage="Guarda publicaciones para leerlas más tarde"
      />
    </div>
  );
}
