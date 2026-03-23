"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { PostWithCounts, PaginatedResponse } from "@/lib/types";
import type { InfiniteData } from "@tanstack/react-query";

type PostPages = InfiniteData<PaginatedResponse<PostWithCounts>>;

export function useBookmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, isBookmarked }: { postId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const supabase = createClient();

      if (isBookmarked) {
        const { error } = await supabase
          .from("bookmarks")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
      }
    },

    // Actualizar el cache antes de que el servidor responda para que la UI sea instantánea
    onMutate: async ({ postId, isBookmarked }) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Guardar el estado previo por si necesitamos revertir
      const previousPosts = queryClient.getQueriesData<PostPages>({ queryKey: ["posts"] });

      // Recorrer todos los caches de feeds y actualizar el post afectado
      queryClient.setQueriesData<PostPages>({ queryKey: ["posts"] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((post) =>
              post.id === postId ? { ...post, is_bookmarked: !isBookmarked } : post
            ),
          })),
        };
      });

      // También actualizar la vista de hilo (query key singular "post")
      queryClient.setQueriesData<PostWithCounts>({ queryKey: ["post", postId] }, (old) => {
        if (!old) return old;
        return { ...old, is_bookmarked: !isBookmarked };
      });

      return { previousPosts };
    },

    // Si el servidor falla, revertir al estado anterior
    onError: (_err, { postId }, context) => {
      if (context?.previousPosts) {
        for (const [key, data] of context.previousPosts) {
          queryClient.setQueryData(key, data);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },

    // Re-sincronizar feeds y vista de hilo con el servidor
    onSettled: (_, __, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
}
