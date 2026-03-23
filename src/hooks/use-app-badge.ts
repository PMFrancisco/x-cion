"use client";

import { useEffect } from "react";
import { useUnreadCount } from "@/hooks/use-notifications";

export function useAppBadge() {
  const { data: unreadCount } = useUnreadCount();

  useEffect(() => {
    if (!("setAppBadge" in navigator)) return;

    if (unreadCount && unreadCount > 0) {
      navigator.setAppBadge(unreadCount).catch(() => {});
    } else {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [unreadCount]);
}
