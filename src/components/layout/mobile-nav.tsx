"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, Settings, Shield, User, Feather, X, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ComposeDialog } from "./compose-dialog";

export function MobileNav() {
  const pathname = usePathname();
  const [composeOpen, setComposeOpen] = useState(false);
  const { profile, isAdmin, isPossessing, actingAs, unpossess } = useAuth();

  const items = [
    { id: "home", href: "/", icon: Home },
    { id: "explore", href: "/explore", icon: Search },
    { id: "bookmarks", href: "/bookmarks", icon: Bookmark },
    ...(isAdmin
      ? [{ id: "admin", href: "/admin", icon: Shield }]
      : [{ id: "settings", href: "/settings", icon: Settings }]),
    { id: "profile", href: profile ? `/${profile.username}` : "/", icon: User },
  ];

  return (
    <>
      {isPossessing && actingAs && (
        <div className="fixed bottom-16 left-0 right-0 z-50 flex items-center justify-between border-t bg-xcion-primary/10 px-4 py-2 md:hidden">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={actingAs.avatar_url ?? undefined} />
              <AvatarFallback className="text-[8px]">
                {getInitials(actingAs.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <Bot className="h-3 w-3 text-xcion-primary" />
              <span className="text-xs font-medium">@{actingAs.username}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={unpossess}
            className="h-7 text-xs text-destructive hover:text-destructive"
          >
            <X className="mr-1 h-3 w-3" />
            Soltar
          </Button>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background md:hidden">
        <div className="grid h-full grid-cols-6 items-center">
          {items.slice(0, 2).map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex h-full items-center justify-center transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          })}

          <Button
            variant="ghost"
            onClick={() => setComposeOpen(true)}
            className="h-full rounded-none text-xcion-primary hover:bg-accent/50 hover:text-xcion-primary"
            aria-label="Publicar"
          >
            <Feather className="h-5 w-5" />
          </Button>

          {items.slice(2).map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex h-full items-center justify-center transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            );
          })}
        </div>
      </nav>

      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
}
