"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ImagePlus, X, Loader2, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePost } from "@/hooks/use-posts";
import { useMentionSuggestions } from "@/hooks/use-search";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import Image from "next/image";

function getMentionQuery(text: string, cursorPos: number): string | null {
  const before = text.slice(0, cursorPos);
  const match = before.match(/@(\w*)$/);
  return match ? match[1] : null;
}

function insertMention(
  text: string,
  cursorPos: number,
  username: string
): { newText: string; newCursor: number } {
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);
  const mentionStart = before.lastIndexOf("@");
  const mention = `@${username} `;
  return {
    newText: before.slice(0, mentionStart) + mention + after,
    newCursor: mentionStart + mention.length,
  };
}

interface PostComposerProps {
  parentId?: string;
  onSuccess?: () => void;
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
}

export function PostComposer({
  parentId,
  onSuccess,
  placeholder = "¿Qué está pasando?",
  compact = false,
  autoFocus = false,
}: PostComposerProps) {
  const { profile, effectiveProfile, isPossessing } = useAuth();
  const createPost = useCreatePost();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef(0);

  const { data: mentionResults } = useMentionSuggestions(mentionQuery);
  const showMentions = mentionQuery !== null && !!mentionResults && mentionResults.length > 0;

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? value.length;
    setContent(value);
    cursorPosRef.current = cursor;

    const query = getMentionQuery(value, cursor);
    setMentionQuery(query);
    setMentionIndex(0);
  }, []);

  const selectMention = useCallback(
    (username: string) => {
      const { newText, newCursor } = insertMention(content, cursorPosRef.current, username);
      setContent(newText);
      setMentionQuery(null);
      setMentionIndex(0);

      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(newCursor, newCursor);
          cursorPosRef.current = newCursor;
        }
      });
    },
    [content]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showMentions || !mentionResults) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => (i + 1) % mentionResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => (i - 1 + mentionResults.length) % mentionResults.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectMention(mentionResults[mentionIndex].username);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
      }
    },
    [showMentions, mentionResults, mentionIndex, selectMention]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length + mediaFiles.length > 4) {
      toast.error("Máximo 4 imágenes por publicación");
      return;
    }

    const compressed = await Promise.all(
      files.map((file) =>
        imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
      )
    );

    setMediaFiles((prev) => [...prev, ...compressed]);

    compressed.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;

    try {
      let mediaUrls: string[] = [];

      if (mediaFiles.length > 0) {
        setUploading(true);
        if (!profile) throw new Error("Not authenticated");
        const supabase = createClient();

        mediaUrls = await Promise.all(
          mediaFiles.map(async (file) => {
            const ext = file.name.split(".").pop();
            const path = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage.from("post-media").upload(path, file);
            if (error) throw error;
            const {
              data: { publicUrl },
            } = supabase.storage.from("post-media").getPublicUrl(path);
            return publicUrl;
          })
        );
        setUploading(false);
      }

      createPost.mutate(
        { content: content.trim(), mediaUrls, parentId },
        {
          onSuccess: () => {
            setContent("");
            setMediaFiles([]);
            setMediaPreviews([]);
            toast.success(parentId ? "Respuesta publicada" : "Publicación creada");
            onSuccess?.();
          },
          onError: () => {
            toast.error("Error al crear la publicación");
          },
        }
      );
    } catch {
      setUploading(false);
      toast.error("Error al subir los archivos");
    }
  };

  if (!profile) return null;

  return (
    <div className="flex gap-3 p-4">
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={effectiveProfile?.avatar_url ?? undefined} />
          <AvatarFallback>{getInitials(effectiveProfile?.display_name ?? "")}</AvatarFallback>
        </Avatar>
        {isPossessing && (
          <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-background p-0.5">
            <Bot className="h-3 w-3 text-xcion-primary" />
          </div>
        )}
      </div>

      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            const ta = e.currentTarget;
            cursorPosRef.current = ta.selectionStart ?? 0;
            setMentionQuery(getMentionQuery(ta.value, cursorPosRef.current));
            setMentionIndex(0);
          }}
          placeholder={placeholder}
          maxLength={280}
          className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-lg focus-visible:ring-0"
          rows={compact ? 2 : 3}
        />

        {showMentions && (
          <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border bg-background shadow-lg">
            {mentionResults.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectMention(p.username);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  i === mentionIndex ? "bg-accent" : "hover:bg-accent/50"
                }`}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(p.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{p.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {mediaPreviews.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {mediaPreviews.map((preview, i) => (
              <div key={i} className="relative aspect-video overflow-hidden rounded-xl">
                <Image src={preview} alt="" fill className="object-cover" />
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-xcion-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={mediaFiles.length >= 4}
            >
              <ImagePlus className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{content.length}/280</span>
            <Button
              onClick={handleSubmit}
              disabled={
                (!content.trim() && mediaFiles.length === 0) || createPost.isPending || uploading
              }
              className="rounded-full bg-xcion-primary px-4 text-white hover:bg-xcion-primary-hover"
            >
              {(createPost.isPending || uploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {parentId ? "Responder" : "Publicar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
