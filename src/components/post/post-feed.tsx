"use client";

import { useEffect, useRef, useCallback } from "react";
import { PostCard } from "./post-card";
import { Loader2 } from "lucide-react";
import type { PostWithCounts } from "@/lib/types";

interface PostFeedProps {
  pages: { data: PostWithCounts[]; nextCursor: string | null }[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  fetchNextPage: () => void;
  emptyMessage?: string;
}

export function PostFeed({
  pages,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  fetchNextPage,
  emptyMessage = "Aún no hay publicaciones",
}: PostFeedProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [handleObserver]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#1d9bf0]" />
      </div>
    );
  }

  const posts = pages?.flatMap((page) => page.data) ?? [];

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-bold">Nada que ver aquí</p>
        <p className="mt-1 text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      <div ref={observerRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-[#1d9bf0]" />
        </div>
      )}
    </div>
  );
}
