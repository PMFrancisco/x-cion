"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
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
        <Loader2 className="h-6 w-6 animate-spin text-[#1d9bf0]" />
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
      <div className="sticky top-0 z-10 flex items-center gap-6 backdrop-blur-md bg-background/80 border-b px-4 py-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">{profile.display_name}</h1>
        </div>
      </div>

      <ProfileHeader profile={profile} />
      <ProfileTabs userId={profile.id} />
    </div>
  );
}
