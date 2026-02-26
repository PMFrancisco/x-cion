"use client";

import { Heart, MessageCircle, Repeat2, Bookmark, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLike } from "@/hooks/use-likes";
import { useBookmark } from "@/hooks/use-bookmarks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PostWithCounts } from "@/lib/types";

interface PostActionsProps {
  post: PostWithCounts;
}

export function PostActions({ post }: PostActionsProps) {
  const likeMutation = useLike();
  const bookmarkMutation = useBookmark();

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    likeMutation.mutate({ postId: post.id, isLiked: post.is_liked });
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    bookmarkMutation.mutate({
      postId: post.id,
      isBookmarked: post.is_bookmarked,
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      `${window.location.origin}/${post.author.username}/status/${post.id}`
    );
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <div className="flex items-center justify-between max-w-md mt-2">
      <Button
        variant="ghost"
        size="sm"
        className="group gap-1 px-2 text-muted-foreground hover:text-[#1d9bf0]"
        onClick={(e) => e.stopPropagation()}
      >
        <MessageCircle className="h-4 w-4 group-hover:text-[#1d9bf0]" />
        {post.reply_count > 0 && (
          <span className="text-xs">{post.reply_count}</span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="group gap-1 px-2 text-muted-foreground hover:text-green-500"
        onClick={(e) => e.stopPropagation()}
      >
        <Repeat2 className="h-4 w-4 group-hover:text-green-500" />
        {post.repost_count > 0 && (
          <span className="text-xs">{post.repost_count}</span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "group gap-1 px-2 hover:text-pink-500",
          post.is_liked ? "text-pink-500" : "text-muted-foreground"
        )}
        onClick={handleLike}
        disabled={likeMutation.isPending}
      >
        <Heart
          className={cn(
            "h-4 w-4 group-hover:text-pink-500",
            post.is_liked && "fill-current"
          )}
        />
        {post.like_count > 0 && (
          <span className="text-xs">{post.like_count}</span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "group gap-1 px-2 hover:text-[#1d9bf0]",
          post.is_bookmarked ? "text-[#1d9bf0]" : "text-muted-foreground"
        )}
        onClick={handleBookmark}
        disabled={bookmarkMutation.isPending}
      >
        <Bookmark
          className={cn(
            "h-4 w-4 group-hover:text-[#1d9bf0]",
            post.is_bookmarked && "fill-current"
          )}
        />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="px-2 text-muted-foreground hover:text-[#1d9bf0]"
        onClick={handleShare}
      >
        <Share className="h-4 w-4" />
      </Button>
    </div>
  );
}
