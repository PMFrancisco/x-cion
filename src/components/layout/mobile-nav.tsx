"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, Bookmark, Feather } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ComposeDialog } from "./compose-dialog";

const navItems = [
  { id: "home", href: "/", icon: Home },
  { id: "explore", href: "/explore", icon: Search },
];

const navItemsAfter = [
  { id: "notifications", href: "/notifications", icon: Bell },
  { id: "bookmarks", href: "/bookmarks", icon: Bookmark },
];

export function MobileNav() {
  const pathname = usePathname();
  const [composeOpen, setComposeOpen] = useState(false);
  const { data: unreadCount } = useUnreadCount();

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background md:hidden">
        <div className="grid h-full grid-cols-5 items-center">
          {navItems.map((item) => (
            <MobileNavItem key={item.id} item={item} pathname={pathname} />
          ))}

          <Button
            variant="ghost"
            onClick={() => setComposeOpen(true)}
            className="h-full rounded-none text-xcion-primary hover:bg-accent/50 hover:text-xcion-primary"
            aria-label="Publicar"
          >
            <Feather className="h-5 w-5" />
          </Button>

          {navItemsAfter.map((item) => (
            <MobileNavItem
              key={item.id}
              item={item}
              pathname={pathname}
              unreadCount={item.id === "notifications" ? unreadCount : undefined}
            />
          ))}
        </div>
      </nav>

      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
}

function MobileNavItem({
  item,
  pathname,
  unreadCount,
}: {
  item: { id: string; href: string; icon: React.ComponentType<{ className?: string }> };
  pathname: string;
  unreadCount?: number | null;
}) {
  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
  const showBadge = !!unreadCount && unreadCount > 0;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-full items-center justify-center transition-colors",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <div className="relative">
        <item.icon className="h-5 w-5" />
        {showBadge && (
          <span className="absolute -right-1.5 -top-1 h-2.5 w-2.5 rounded-full bg-xcion-primary" />
        )}
      </div>
    </Link>
  );
}
