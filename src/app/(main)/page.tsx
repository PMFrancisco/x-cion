"use client";

import { useState } from "react";
import { PostComposer } from "@/components/post/post-composer";
import { PostFeed } from "@/components/post/post-feed";
import { usePosts } from "@/hooks/use-posts";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [feedType, setFeedType] = useState<"home" | "explore">("home");

  const { data, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } = usePosts({
    feedType,
  });

  return (
    <div>
      <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b">
        <h1 className="px-4 py-3 text-xl font-bold">Inicio</h1>
        <div className="flex">
          <button
            onClick={() => setFeedType("home")}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium transition-colors hover:bg-accent/50",
              feedType === "home"
                ? "border-b-2 border-[#1d9bf0] text-foreground"
                : "text-muted-foreground"
            )}
          >
            Para ti
          </button>
          <button
            onClick={() => setFeedType("explore")}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium transition-colors hover:bg-accent/50",
              feedType === "explore"
                ? "border-b-2 border-[#1d9bf0] text-foreground"
                : "text-muted-foreground"
            )}
          >
            Siguiendo
          </button>
        </div>
      </div>

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
