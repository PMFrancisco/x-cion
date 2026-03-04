"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  MoreHorizontal,
  Trash2,
  Pencil,
  Shield,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
  showConnector?: boolean;
}

export function PostCard({
  post,
  variant = "feed",
  showActions = true,
  showConnector = false,
}: PostCardProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const deletePost = useDeletePost();
  const updatePost = useUpdatePost();
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const prevImage = useCallback(() => {
    setLightboxIndex((i) => (i - 1 + post.media_urls.length) % post.media_urls.length);
  }, [post.media_urls.length]);

  const nextImage = useCallback(() => {
    setLightboxIndex((i) => (i + 1) % post.media_urls.length);
  }, [post.media_urls.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      else if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prevImage, nextImage]);

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
          <div className="flex flex-col items-center shrink-0">
            <Link href={`/${post.author.username}`} onClick={(e) => e.stopPropagation()}>
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.author.avatar_url ?? undefined} />
                <AvatarFallback>{getInitials(post.author.display_name)}</AvatarFallback>
              </Avatar>
            </Link>
            {showConnector && <div className="mt-1 w-0.5 flex-1 rounded-full bg-border" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <Link
                href={`/${post.author.username}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate font-bold hover:underline"
              >
                {post.author.display_name}
              </Link>
              {post.author.is_npc && <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
              {post.author.role === "admin" && !post.author.is_npc && (
                <Shield className="h-3.5 w-3.5 text-xcion-primary" />
              )}
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
                  <div
                    key={i}
                    className="relative aspect-video overflow-hidden cursor-zoom-in"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(i);
                    }}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            )}

            {showActions && <PostActions post={post} />}
          </div>
        </div>
      </article>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl border-none bg-black/95 p-0 shadow-none [&>button]:text-white">
          <DialogTitle className="sr-only">Ver imagen</DialogTitle>
          <div className="relative flex h-[90vh] items-center justify-center">
            <Image
              src={post.media_urls[lightboxIndex]}
              alt=""
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 80vw"
            />
            {post.media_urls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {post.media_urls.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxIndex(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === lightboxIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                className="bg-xcion-primary text-white hover:bg-xcion-primary-hover"
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
