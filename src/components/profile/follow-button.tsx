"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsFollowing, useFollow } from "@/hooks/use-follows";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetUserId: string;
}

export function FollowButton({ targetUserId }: FollowButtonProps) {
  const { user } = useAuth();
  const { data: isFollowing, isLoading } = useIsFollowing(targetUserId);
  const followMutation = useFollow();
  const [hovering, setHovering] = useState(false);

  if (!user || user.id === targetUserId) return null;

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className="rounded-full">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  const handleClick = () => {
    followMutation.mutate({
      targetUserId,
      isFollowing: !!isFollowing,
    });
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className={cn(
        "rounded-full font-bold min-w-[100px]",
        !isFollowing && "bg-foreground text-background hover:bg-foreground/90",
        isFollowing && hovering && "border-destructive text-destructive hover:bg-destructive/10"
      )}
      onClick={handleClick}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      disabled={followMutation.isPending}
    >
      {isFollowing ? (hovering ? "Dejar de seguir" : "Siguiendo") : "Seguir"}
    </Button>
  );
}
