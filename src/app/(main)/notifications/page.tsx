"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Heart, MessageCircle, UserPlus, AtSign, CheckCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { useNotifications, useMarkRead } from "@/hooks/use-notifications";
import { getInitials, cn, formatRelativeTime } from "@/lib/utils";
import type { Notification, Profile, Post } from "@/lib/types";

type NotificationWithRelations = Notification & {
  actor: Profile;
  post: Post | null;
};

const notifConfig: Record<string, { icon: typeof Heart; label: string; color: string }> = {
  like: { icon: Heart, label: "le gustó tu publicación", color: "text-rose-500" },
  reply: { icon: MessageCircle, label: "respondió a tu publicación", color: "text-sky-500" },
  follow: { icon: UserPlus, label: "te siguió", color: "text-green-500" },
  mention: { icon: AtSign, label: "te mencionó", color: "text-xcion-primary" },
  repost: { icon: MessageCircle, label: "reposteó tu publicación", color: "text-emerald-500" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data, hasNextPage, isFetchingNextPage, isLoading, fetchNextPage } = useNotifications();
  const markRead = useMarkRead();
  const observerRef = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [handleObserver]);

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];

  const hasUnread = notifications.some((n) => !n.read);

  function getNotifHref(notif: NotificationWithRelations) {
    if (notif.type === "follow") {
      return `/${notif.actor.username}`;
    }
    if (notif.post) {
      return `/${notif.actor.username}/status/${notif.post.id}`;
    }
    return `/${notif.actor.username}`;
  }

  function handleClick(notif: NotificationWithRelations) {
    if (!notif.read) {
      markRead.mutate(notif.id);
    }
    router.push(getNotifHref(notif));
  }

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        rightContent={
          hasUnread ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markRead.mutate(undefined)}
              disabled={markRead.isPending}
              className="text-xs text-muted-foreground"
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Marcar todo como leído
            </Button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-xcion-primary" />
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-bold">Nada que ver aquí</p>
          <p className="mt-1 text-muted-foreground">
            Las notificaciones aparecerán cuando alguien interactúe contigo.
          </p>
        </div>
      )}

      {!isLoading && notifications.length > 0 && (
        <div>
          {notifications.map((notif) => {
            const config = notifConfig[notif.type] ?? notifConfig.like;
            const Icon = config.icon;

            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif as NotificationWithRelations)}
                className={cn(
                  "flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50",
                  !notif.read && "bg-xcion-primary/5"
                )}
              >
                <div className={cn("mt-0.5 shrink-0", config.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={notif.actor?.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(notif.actor?.display_name ?? "")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-bold">{notif.actor?.display_name}</span>{" "}
                        <span className="text-muted-foreground">{config.label}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                  {notif.post && notif.type !== "follow" && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {notif.post.content}
                    </p>
                  )}
                </div>
              </button>
            );
          })}

          <div ref={observerRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-xcion-primary" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
