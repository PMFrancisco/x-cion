"use client";

import { useState } from "react";
import { PostFeed } from "@/components/post/post-feed";
import { usePosts } from "@/hooks/use-posts";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
  userId: string;
}

type TabType = "posts" | "replies" | "likes";

const tabs: { value: TabType; label: string }[] = [
  { value: "posts", label: "Publicaciones" },
  { value: "replies", label: "Respuestas" },
  { value: "likes", label: "Me gusta" },
];

export function ProfileTabs({ userId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("posts");

  const feedType =
    activeTab === "posts"
      ? "user"
      : activeTab === "replies"
      ? "replies"
      : "likes";

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    fetchNextPage,
  } = usePosts({ feedType, userId });

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex-1 py-3 text-center text-sm font-medium transition-colors hover:bg-accent/50",
              activeTab === tab.value
                ? "border-b-2 border-[#1d9bf0] text-foreground"
                : "text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <PostFeed
        pages={data?.pages ?? []}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        fetchNextPage={fetchNextPage}
        emptyMessage={
          activeTab === "posts"
            ? "Aún no hay publicaciones"
            : activeTab === "replies"
            ? "Aún no hay respuestas"
            : "Aún no hay me gusta"
        }
      />
    </div>
  );
}
