"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, Settings, User, Feather } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ComposeDialog } from "./compose-dialog";

export function MobileNav() {
  const pathname = usePathname();
  const [composeOpen, setComposeOpen] = useState(false);
  const { profile } = useAuth();

  const items = [
    { id: "home", href: "/", icon: Home },
    { id: "explore", href: "/explore", icon: Search },
    { id: "bookmarks", href: "/bookmarks", icon: Bookmark },
    { id: "settings", href: "/settings", icon: Settings },
    { id: "profile", href: profile ? `/${profile.username}` : "/", icon: User },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background md:hidden">
        <div className="grid h-full grid-cols-6 items-center">
          {items.slice(0, 2).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
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
            className="h-full rounded-none text-[#1d9bf0] hover:bg-accent/50 hover:text-[#1d9bf0]"
            aria-label="Publicar"
          >
            <Feather className="h-5 w-5" />
          </Button>

          {items.slice(2).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
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
