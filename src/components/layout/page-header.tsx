"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMobileDrawer } from "@/contexts/mobile-drawer-context";
import { getInitials } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backButton?: boolean;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backButton,
  rightContent,
  children,
}: PageHeaderProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const { setOpen } = useMobileDrawer();

  return (
    <div className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b">
      <div className="flex items-center gap-3 px-4 py-3">
        {backButton ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 md:hidden"
            aria-label="Abrir menú"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(profile?.display_name ?? "")}
              </AvatarFallback>
            </Avatar>
          </button>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground truncate">{subtitle}</p>}
        </div>

        {rightContent && <div className="shrink-0">{rightContent}</div>}
      </div>

      {children}
    </div>
  );
}
