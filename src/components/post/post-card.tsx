"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MoreHorizontal, Trash2, Pencil, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostActions } from "./post-actions";
import { PostContent } from "./post-content";
import { useAuth } from "@/hooks/use-auth";
import { useDeletePost, useUpdatePost } from "@/hooks/use-posts";
import { formatRelativeTime, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";
import type { PostWithCounts } from "@/lib/types";

interface PostCardProps {
  post: PostWithCounts;
  variant?: "feed" | "detail";
  showActions?: boolean;
}

export function PostCard({ post, variant = "feed", showActions = true }: PostCardProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const isAuthor = user?.id === post.author_id;
  const canModify = isAuthor || isAdmin;

  const handleClick = () => {
    if (variant === "detail") return;
    router.push(`/${post.author.username}/status/${post.id}`);
  };

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => toast.success("Publicación eliminada"),
      onError: () => toast.error("Error al eliminar la publicación"),
    });
  };

  const handleEdit = () => {
    updatePost.mutate(
      { postId: post.id, content: editContent },
      {
        onSuccess: () => {
          setEditOpen(false);
          toast.success("Publicación actualizada");
        },
        onError: () => toast.error("Error al actualizar la publicación"),
      }
    );
  };

  return (
    <>
      <article
        onClick={handleClick}
        className={cn(
          "border-b px-4 py-3 transition-colors",
          variant === "feed" && "cursor-pointer hover:bg-accent/50"
        )}
      >
        <div className="flex gap-3">
          <Link
            href={`/${post.author.username}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.avatar_url ?? undefined} />
              <AvatarFallback>{getInitials(post.author.display_name)}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Link
                href={`/${post.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate font-bold hover:underline"
              >
                {post.author.display_name}
              </Link>
              {post.author.role === "admin" && <Shield className="h-3.5 w-3.5 text-[#1d9bf0]" />}
              <Link
                href={`/${post.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-muted-foreground"
              >
                @{post.author.username}
              </Link>
              <span className="text-muted-foreground">·</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {formatRelativeTime(post.created_at)}
              </span>

              {canModify && (
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditContent(post.content);
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar{!isAuthor && " (Admin)"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar{!isAuthor && " (Admin)"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            <PostContent text={post.content} />

            {post.media_urls.length > 0 && (
              <div
                className={cn(
                  "mt-3 grid gap-1 overflow-hidden rounded-2xl border",
                  post.media_urls.length === 1 && "grid-cols-1",
                  post.media_urls.length === 2 && "grid-cols-2",
                  post.media_urls.length >= 3 && "grid-cols-2"
                )}
              >
                {post.media_urls.map((url, i) => (
                  <div key={i} className="relative aspect-video overflow-hidden">
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                ))}
              </div>
            )}

            {showActions && <PostActions post={post} />}
          </div>
        </div>
      </article>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar publicación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={280}
              className="min-h-[120px] resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{editContent.length}/280</span>
              <Button
                onClick={handleEdit}
                disabled={
                  updatePost.isPending || !editContent.trim() || editContent === post.content
                }
                className="bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
