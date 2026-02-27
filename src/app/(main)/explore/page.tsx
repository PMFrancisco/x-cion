"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/post/post-card";
import { PostFeed } from "@/components/post/post-feed";
import { FollowButton } from "@/components/profile/follow-button";
import { useSearchProfiles, useSearchPosts } from "@/hooks/use-search";
import { usePosts } from "@/hooks/use-posts";
import { getInitials, cn } from "@/lib/utils";

type Tab = "posts" | "people";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<Tab>("posts");

  const isSearching = query.trim().length >= 1;

  const { data: searchedPosts, isLoading: postsLoading } = useSearchPosts(query);
  const { data: profiles, isLoading: profilesLoading } = useSearchProfiles(query);

  const {
    data: exploreData,
    hasNextPage,
    isFetchingNextPage,
    isLoading: exploreLoading,
    fetchNextPage,
  } = usePosts({ feedType: "explore" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.replace(`/explore?q=${encodeURIComponent(trimmed)}`);
  };

  const searchLoading = tab === "posts" ? postsLoading : profilesLoading;

  return (
    <div>
      <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b">
        <h1 className="px-4 py-3 text-xl font-bold">Explorar</h1>

        <div className="px-4 pb-3">
          <form onSubmit={handleSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar en Xcion"
              className="rounded-full bg-secondary pl-10"
            />
          </form>
        </div>

        {isSearching && (
          <div className="flex">
            <button
              onClick={() => setTab("posts")}
              className={cn(
                "flex-1 py-3 text-center text-sm font-medium transition-colors hover:bg-accent/50",
                tab === "posts"
                  ? "border-b-2 border-xcion-blue text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Publicaciones
            </button>
            <button
              onClick={() => setTab("people")}
              className={cn(
                "flex-1 py-3 text-center text-sm font-medium transition-colors hover:bg-accent/50",
                tab === "people"
                  ? "border-b-2 border-xcion-blue text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Personas
            </button>
          </div>
        )}
      </div>

      {!isSearching && (
        <PostFeed
          pages={exploreData?.pages ?? []}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={exploreLoading}
          fetchNextPage={fetchNextPage}
          emptyMessage="Aún no hay publicaciones. ¡Sé el primero en publicar!"
        />
      )}

      {isSearching && searchLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-xcion-blue" />
        </div>
      )}

      {isSearching && !searchLoading && tab === "posts" && (
        <>
          {searchedPosts && searchedPosts.length > 0 ? (
            <div>
              {searchedPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-lg font-bold">Sin resultados para &quot;{query.trim()}&quot;</p>
              <p className="mt-1 text-muted-foreground">Intenta buscar con otros términos.</p>
            </div>
          )}
        </>
      )}

      {isSearching && !searchLoading && tab === "people" && (
        <>
          {profiles && profiles.length > 0 ? (
            <div>
              {profiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/${profile.username}`}
                  className="flex items-center gap-3 border-b px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url ?? undefined} />
                    <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{profile.display_name}</p>
                    <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
                    {profile.bio && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                        {profile.bio}
                      </p>
                    )}
                  </div>
                  <div onClick={(e) => e.preventDefault()}>
                    <FollowButton targetUserId={profile.id} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <p className="text-lg font-bold">Sin resultados para &quot;{query.trim()}&quot;</p>
              <p className="mt-1 text-muted-foreground">Intenta buscar con otros términos.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
