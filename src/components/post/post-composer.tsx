"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useCreatePost } from "@/hooks/use-posts";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import Image from "next/image";

interface PostComposerProps {
  parentId?: string;
  onSuccess?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function PostComposer({
  parentId,
  onSuccess,
  placeholder = "¿Qué está pasando?",
  compact = false,
}: PostComposerProps) {
  const { profile } = useAuth();
  const createPost = useCreatePost();
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={profile.avatar_url ?? undefined} />
        <AvatarFallback>{getInitials(profile.display_name)}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength={280}
          className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-lg focus-visible:ring-0"
          rows={compact ? 2 : 3}
        />

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
              className="h-9 w-9 text-[#1d9bf0]"
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
              className="rounded-full bg-[#1d9bf0] px-4 text-white hover:bg-[#1a8cd8]"
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
