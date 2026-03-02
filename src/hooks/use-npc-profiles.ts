"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Profile } from "@/lib/types";

export function useNpcProfiles() {
  return useQuery({
    queryKey: ["npc-profiles"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_npc", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export function useCreateNpc() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      username,
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
    }: {
      username: string;
      displayName: string;
      bio?: string;
      avatarUrl?: string;
      bannerUrl?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const supabase = createClient();

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          username,
          display_name: displayName,
          bio: bio ?? "",
          avatar_url: avatarUrl ?? null,
          banner_url: bannerUrl ?? null,
          role: "user",
          is_npc: true,
          created_by: user.id,
          onboarding_completed: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["npc-profiles"] });
    },
  });
}

export function useUpdateNpc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      username,
      displayName,
      bio,
      avatarUrl,
      bannerUrl,
    }: {
      id: string;
      username?: string;
      displayName?: string;
      bio?: string;
      avatarUrl?: string | null;
      bannerUrl?: string | null;
    }) => {
      const supabase = createClient();
      const updates: Record<string, unknown> = {};
      if (username !== undefined) updates.username = username;
      if (displayName !== undefined) updates.display_name = displayName;
      if (bio !== undefined) updates.bio = bio;
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
      if (bannerUrl !== undefined) updates.banner_url = bannerUrl;

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .eq("is_npc", true)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["npc-profiles"] });
    },
  });
}

export function useDeleteNpc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").delete().eq("id", id).eq("is_npc", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["npc-profiles"] });
    },
  });
}
