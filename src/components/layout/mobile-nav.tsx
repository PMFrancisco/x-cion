"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { profile } = useAuth();

  const items = [
    { id: "home", href: "/", icon: Home },
    { id: "explore", href: "/explore", icon: Search },
    { id: "bookmarks", href: "/bookmarks", icon: Bookmark },
    { id: "profile", href: profile ? `/${profile.username}` : "/", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t bg-background md:hidden">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex h-full flex-1 items-center justify-center transition-colors",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        );
      })}
    </nav>
  );
}
