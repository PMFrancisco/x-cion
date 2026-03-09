"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Settings, Shield, LogOut, X, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useFollowCounts } from "@/hooks/use-follows";
import { useMobileDrawer } from "@/contexts/mobile-drawer-context";
import { cn, getInitials } from "@/lib/utils";

const drawerNavItems = [
  { href: (username: string) => `/${username}`, label: "Perfil", icon: User, isDynamic: true },
  { href: () => "/settings", label: "Configuración", icon: Settings, isDynamic: false },
];

export function MobileDrawer() {
  const pathname = usePathname();
  const { open, setOpen } = useMobileDrawer();
  const { profile, isAdmin, signOut, isPossessing, actingAs, unpossess } = useAuth();
  const { data: counts } = useFollowCounts(profile?.id ?? "");

  const handleNavClick = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" showCloseButton={false} className="w-[280px] p-0 md:hidden">
        <SheetTitle className="sr-only">Menú</SheetTitle>

        <div className="flex h-full flex-col">
          {/* User info header */}
          <div className="border-b p-4">
            <Link href={profile ? `/${profile.username}` : "#"} onClick={handleNavClick}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback>{getInitials(profile?.display_name ?? "")}</AvatarFallback>
              </Avatar>
            </Link>

            <div className="mt-2">
              <p className="font-bold leading-tight">{profile?.display_name}</p>
              <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            </div>

            <div className="mt-3 flex gap-4 text-sm">
              <Link
                href={profile ? `/${profile.username}` : "#"}
                onClick={handleNavClick}
                className="hover:underline"
              >
                <strong>{counts?.following ?? 0}</strong>{" "}
                <span className="text-muted-foreground">Siguiendo</span>
              </Link>
              <Link
                href={profile ? `/${profile.username}` : "#"}
                onClick={handleNavClick}
                className="hover:underline"
              >
                <strong>{counts?.followers ?? 0}</strong>{" "}
                <span className="text-muted-foreground">Seguidores</span>
              </Link>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2">
            {drawerNavItems.map((item) => {
              const href = item.isDynamic ? item.href(profile?.username ?? "") : item.href("");
              const isActive = pathname === href;

              return (
                <Link
                  key={item.label}
                  href={href}
                  onClick={handleNavClick}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent",
                    isActive && "font-bold"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent",
                  pathname.startsWith("/admin") && "font-bold"
                )}
              >
                <Shield className="h-5 w-5" />
                <span>Administración</span>
              </Link>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t p-4 space-y-2">
            {isPossessing && actingAs && (
              <div className="flex items-center gap-2 rounded-xl border border-xcion-primary/30 bg-xcion-primary/5 p-2">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={actingAs.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(actingAs.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Bot className="h-3 w-3 text-xcion-primary shrink-0" />
                    <span className="text-xs font-medium truncate">{actingAs.display_name}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">Poseyendo NPC</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={unpossess}
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            <Button variant="ghost" onClick={signOut} className="w-full justify-start gap-4 px-2">
              <LogOut className="h-5 w-5" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
