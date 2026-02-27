"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bookmark, User, Settings, Shield, Feather, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ComposeDialog } from "./compose-dialog";

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/explore", label: "Explorar", icon: Search },
  { href: "/bookmarks", label: "Guardados", icon: Bookmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, isAdmin, signOut } = useAuth();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[68px] flex-col items-center justify-between border-r py-4 md:flex xl:w-[260px] xl:items-start xl:px-4">
        <div className="flex flex-col items-center gap-1 xl:items-start">
          <Link
            href="/"
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full transition-colors hover:bg-accent"
          >
            <span className="text-2xl font-bold text-xcion-blue">Xcion</span>
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

          {profile && (
            <Link
              href={`/${profile.username}`}
              className={cn(
                "flex h-12 items-center gap-4 rounded-full px-3 transition-colors hover:bg-accent xl:pr-6",
                pathname === `/${profile.username}` && "font-bold"
              )}
            >
              <User className="h-6 w-6" />
              <span className="hidden xl:block">Perfil</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex h-12 items-center gap-4 rounded-full px-3 transition-colors hover:bg-accent xl:pr-6",
                pathname === "/admin" && "font-bold"
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
            className="mt-4 h-12 w-12 rounded-full bg-xcion-blue text-white hover:bg-xcion-blue-hover xl:w-full"
          >
            <Feather className="h-5 w-5 xl:hidden" />
            <span className="hidden xl:block">Publicar</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="h-12 w-12 rounded-full xl:w-full xl:justify-start xl:gap-4 xl:px-3"
        >
          <LogOut className="h-5 w-5" />
          <span className="hidden xl:block">Cerrar sesión</span>
        </Button>
      </aside>

      <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
    </>
  );
}
