"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSearchProfiles } from "@/hooks/use-search";
import { getInitials, cn } from "@/lib/utils";

export function RightPanel() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: profiles, isLoading } = useSearchProfiles(query);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
  };

  const showDropdown = open && query.trim().length >= 1;

  return (
    <aside className="sticky top-0 hidden h-screen w-[350px] flex-col gap-4 overflow-y-auto py-4 px-6 lg:flex">
      <div ref={containerRef} className="relative">
        <form onSubmit={handleSubmit}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query.trim() && setOpen(true)}
            placeholder="Buscar en Xcion"
            className="rounded-full bg-secondary pl-10"
          />
        </form>

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-2xl border bg-background shadow-lg">
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && profiles && profiles.length > 0 && (
              <div>
                {profiles.slice(0, 5).map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/${profile.username}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile.avatar_url ?? undefined} />
                      <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{profile.display_name}</p>
                      <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!isLoading && query.trim() && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-accent/50",
                  profiles && profiles.length > 0 && "border-t"
                )}
              >
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Buscar &quot;{query.trim()}&quot;</span>
              </button>
            )}

            {!isLoading && profiles && profiles.length === 0 && !query.trim() && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Intenta buscar personas o publicaciones
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-secondary p-4">
        <h2 className="mb-4 text-xl font-bold">Qué está pasando</h2>
        <p className="text-sm text-muted-foreground">Los temas de tendencia aparecerán aquí.</p>
      </div>

      <div className="rounded-2xl bg-secondary p-4">
        <h2 className="mb-4 text-xl font-bold">A quién seguir</h2>
        <p className="text-sm text-muted-foreground">Las sugerencias aparecerán aquí.</p>
      </div>
    </aside>
  );
}
