"use client";

import { useParams } from "next/navigation";
import { PostFeed } from "@/components/post/post-feed";
import { useHashtagPosts } from "@/hooks/use-hashtags";
import { PageHeader } from "@/components/layout/page-header";

export default function HashtagPage() {
  const params = useParams<{ tag: string }>();
  const tag = decodeURIComponent(params.tag);

  const { data, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } = useHashtagPosts(tag);

  return (
    <div>
      <PageHeader title={`#${tag}`} backButton />

      <PostFeed
        pages={data?.pages ?? []}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        emptyMessage="Aún no hay publicaciones con este hashtag."
      />
    </div>
  );
}
