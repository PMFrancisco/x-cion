"use client";

import { useState } from "react";
import { PostComposer } from "@/components/post/post-composer";
import { PostFeed } from "@/components/post/post-feed";
import { usePosts } from "@/hooks/use-posts";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [feedType, setFeedType] = useState<"home" | "explore">("explore");

  const { data, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } = usePosts({
    feedType,
  });

  return (
    <div>
      <PageHeader title="Inicio">
        <div className="flex">
          <button
            onClick={() => setFeedType("explore")}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium transition-colors hover:bg-accent/50",
              feedType === "explore"
                ? "border-b-2 border-xcion-primary text-foreground"
                : "text-muted-foreground"
            )}
          >
            Para ti
          </button>
          <button
            onClick={() => setFeedType("home")}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium transition-colors hover:bg-accent/50",
              feedType === "home"
                ? "border-b-2 border-xcion-primary text-foreground"
                : "text-muted-foreground"
            )}
          >
            Siguiendo
          </button>
        </div>
      </PageHeader>

      <PostComposer />
      <Separator />

      <PostFeed
        pages={data?.pages ?? []}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        emptyMessage="Sigue a alguien para ver sus publicaciones aquí"
      />
    </div>
  );
}
