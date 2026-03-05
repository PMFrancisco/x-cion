"use client";

import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDown } from "lucide-react";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";
import { PostFeed } from "./post-feed";
import { usePosts } from "@/hooks/use-posts";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PostWithCounts } from "@/lib/types";

interface PostThreadProps {
  post: PostWithCounts;
}

export function PostThread({ post }: PostThreadProps) {
  const searchParams = useSearchParams();
  const shouldFocusReply = searchParams.get("reply") === "true";
  const { data, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } = usePosts({
    parentId: post.id,
  });
  const endRef = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  useEffect(() => {
    const onScroll = () => {
      if (posts.length < 3 || !endRef.current) {
        setShowJump(false);
        return;
      }
      const rect = endRef.current.getBoundingClientRect();
      setShowJump(rect.top > window.innerHeight + 200);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [posts.length]);

  const scrollToEnd = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <PostCard post={post} variant="detail" showConnector />
      <PostComposer
        parentId={post.id}
        placeholder="Publica tu respuesta"
        compact
        autoFocus={shouldFocusReply}
      />
      <Separator />
      <PostFeed
        pages={data?.pages ?? []}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        emptyMessage="Aún no hay respuestas. ¡Sé el primero en responder!"
        threadConnectors
      />
      <div ref={endRef} />

      <Button
        onClick={scrollToEnd}
        size="icon"
        className={cn(
          "fixed bottom-20 right-4 z-40 h-10 w-10 md:bottom-6 md:right-6 md:h-11 md:w-11 rounded-full bg-xcion-primary/50 backdrop-blur-sm text-white shadow-lg hover:bg-xcion-primary transition-all duration-300",
          showJump ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <ArrowDown className="h-5 w-5" />
      </Button>
    </div>
  );
}
