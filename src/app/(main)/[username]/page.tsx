"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (error) throw error;
      return data as Profile;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-xcion-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-bold">Usuario no encontrado</p>
        <p className="text-muted-foreground">@{username} no existe</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={profile.display_name} backButton />

      <ProfileHeader profile={profile} />
      <ProfileTabs userId={profile.id} />
    </div>
  );
}
