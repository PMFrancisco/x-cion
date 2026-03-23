"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useIsFollowing(targetUserId: string) {
  const { effectiveProfileId, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["following", targetUserId, effectiveProfileId],
    queryFn: async () => {
      if (!effectiveProfileId) return false;
      const supabase = createClient();

      const { data } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", effectiveProfileId)
        .eq("following_id", targetUserId)
        .single();

      return !!data;
    },
    enabled: !!targetUserId && !authLoading,
  });
}

export function useFollow() {
  const queryClient = useQueryClient();
  const { effectiveProfileId } = useAuth();

  return useMutation({
    mutationFn: async ({
      targetUserId,
      isFollowing,
    }: {
      targetUserId: string;
      isFollowing: boolean;
    }) => {
      if (!effectiveProfileId) throw new Error("Not authenticated");
      const supabase = createClient();

      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", effectiveProfileId)
          .eq("following_id", targetUserId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: effectiveProfileId,
          following_id: targetUserId,
        });
        if (error) throw error;
      }
    },

    // Actualizar el cache antes de que el servidor responda para que el botón reaccione al instante
    onMutate: async ({ targetUserId, isFollowing }) => {
      // Cancelar queries en curso para que no sobreescriban el cambio optimista
      await queryClient.cancelQueries({ queryKey: ["following", targetUserId] });
      await queryClient.cancelQueries({ queryKey: ["follow-counts", targetUserId] });

      // Guardar estado previo para revertir si falla
      const prevFollowing = queryClient.getQueryData<boolean>([
        "following",
        targetUserId,
        effectiveProfileId,
      ]);
      const prevCounts = queryClient.getQueryData<{ followers: number; following: number }>([
        "follow-counts",
        targetUserId,
      ]);

      // Invertir el estado de follow inmediatamente
      queryClient.setQueryData(["following", targetUserId, effectiveProfileId], !isFollowing);

      // Actualizar el contador de seguidores del perfil objetivo
      if (prevCounts) {
        queryClient.setQueryData(["follow-counts", targetUserId], {
          ...prevCounts,
          followers: prevCounts.followers + (isFollowing ? -1 : 1),
        });
      }

      return { prevFollowing, prevCounts, targetUserId };
    },

    // Si el servidor falla, revertir al estado anterior
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(
        ["following", context.targetUserId, effectiveProfileId],
        context.prevFollowing
      );
      if (context.prevCounts) {
        queryClient.setQueryData(["follow-counts", context.targetUserId], context.prevCounts);
      }
    },

    // Re-sincronizar follow state y contadores (no posts: seguir/dejar no cambia los posts en sí)
    onSettled: (_, __, { targetUserId }) => {
      queryClient.invalidateQueries({ queryKey: ["following", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["follow-counts", targetUserId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useFollowCounts(userId: string) {
  return useQuery({
    queryKey: ["follow-counts", userId],
    queryFn: async () => {
      const supabase = createClient();

      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      return {
        followers: followers ?? 0,
        following: following ?? 0,
      };
    },
    enabled: !!userId,
  });
}
