"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, cn } from "@/lib/utils";

interface UserAvatarProps {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export function UserAvatar({
  username,
  displayName,
  avatarUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  return (
    <Link href={`/${username}`} className={cn("shrink-0", className)}>
      <Avatar className={sizeMap[size]}>
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
    </Link>
  );
}
