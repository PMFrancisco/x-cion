"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Bookmark,
  User,
  Settings,
  Shield,
  Feather,
  LogOut,
  X,
  Bot,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn, getInitials } from "@/lib/utils";
import { useState } from "react";
import { ComposeDialog } from "./compose-dialog";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/explore", label: "Explorar", icon: Search },
  { href: "/bookmarks", label: "Guardados", icon: Bookmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, isAdmin, signOut, isPossessing, actingAs, unpossess } = useAuth();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[68px] flex-col items-center justify-between border-r py-4 md:flex xl:w-[260px] xl:items-start xl:px-4">
        <div className="flex flex-col items-center gap-1 xl:items-start">
          <Link
            href="/"
            className="mb-4 flex h-12 items-center gap-2 rounded-full px-2 transition-colors hover:bg-accent"
          >
            <Image src="/icons/icon-192x192.png" alt="Xcion" width={32} height={32} />
            <span className="hidden text-2xl font-bold text-xcion-primary xl:block">Xcion</span>
          </Link>

          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-12 items-center gap-4 rounded-full px-3 transition-colors hover:bg-accent xl:pr-6",
                  isActive && "font-bold"
                )}
              >
                <item.icon className="h-6 w-6" />
                <span className="hidden xl:block">{item.label}</span>
              </Link>
            );
          })}

          <Link
            href={profile ? `/${profile.username}` : "#"}
            className={cn(
              "flex h-12 items-center gap-4 rounded-full px-3 transition-colors hover:bg-accent xl:pr-6",
              profile && pathname === `/${profile.username}` && "font-bold"
            )}
          >
            <User className="h-6 w-6" />
            <span className="hidden xl:block">Perfil</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex h-12 items-center gap-4 rounded-full px-3 transition-colors hover:bg-accent xl:pr-6",
                pathname.startsWith("/admin") && "font-bold"
              )}
            >
              <Shield className="h-6 w-6" />
              <span className="hidden xl:block">Administración</span>
            </Link>
          )}

          <Link
            href="/settings"
            className={cn(
              "flex h-12 items-center gap-4 rounded-full px-3 transition-colors hover:bg-accent xl:pr-6",
              pathname === "/settings" && "font-bold"
            )}
          >
            <Settings className="h-6 w-6" />
            <span className="hidden xl:block">Configuración</span>
          </Link>

          <Button
            onClick={() => setComposeOpen(true)}
            className="mt-4 h-12 w-12 rounded-full bg-xcion-primary text-white hover:bg-xcion-primary-hover xl:w-full"
          >
            <Feather className="h-5 w-5 xl:hidden" />
            <span className="hidden xl:block">Publicar</span>
          </Button>
        </div>

        <div className="flex flex-col items-center gap-2 xl:w-full">
          {isPossessing && actingAs && (
            <div className="flex w-full items-center gap-2 rounded-xl border border-xcion-primary/30 bg-xcion-primary/5 p-2">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={actingAs.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs">
                  {getInitials(actingAs.display_name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-1 min-w-0 xl:block">
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

          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-12 w-12 rounded-full xl:w-full xl:justify-start xl:gap-4 xl:px-3"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden xl:block">Cerrar sesión</span>
          </Button>
        </div>
      </aside>

      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
}
