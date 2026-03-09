"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostFeed } from "@/components/post/post-feed";
import { useHashtagPosts } from "@/hooks/use-hashtags";

export default function HashtagPage() {
  const params = useParams<{ tag: string }>();
  const router = useRouter();
  const tag = decodeURIComponent(params.tag);

  const { data, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } = useHashtagPosts(tag);

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="rounded-full p-1.5 transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">#{tag}</h1>
        </div>
      </div>

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
