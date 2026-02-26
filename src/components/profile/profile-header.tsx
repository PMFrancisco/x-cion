"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { CalendarDays, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "./follow-button";
import { EditProfileDialog } from "./edit-profile-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFollowCounts } from "@/hooks/use-follows";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/lib/types";

interface ProfileHeaderProps {
  profile: Profile;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user } = useAuth();
  const { data: counts } = useFollowCounts(profile.id);
  const [editOpen, setEditOpen] = useState(false);
  const isOwnProfile = user?.id === profile.id;

  return (
    <div>
      <div className="relative h-32 bg-secondary sm:h-48">
        {profile.banner_url && (
          <Image
            src={profile.banner_url}
            alt=""
            fill
            className="object-cover"
          />
        )}
      </div>

      <div className="px-4">
        <div className="relative flex justify-between">
          <Avatar className="-mt-12 h-20 w-20 border-4 border-background sm:-mt-16 sm:h-32 sm:w-32">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl sm:text-4xl">
              {getInitials(profile.display_name)}
            </AvatarFallback>
          </Avatar>

          <div className="mt-3">
            {isOwnProfile ? (
              <Button
                variant="outline"
                className="rounded-full font-bold"
                onClick={() => setEditOpen(true)}
              >
                Editar perfil
              </Button>
            ) : (
              <FollowButton targetUserId={profile.id} />
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-1">
            <h2 className="text-xl font-bold">{profile.display_name}</h2>
            {profile.role === "admin" && (
              <Shield className="h-4 w-4 text-[#1d9bf0]" />
            )}
          </div>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="mt-3 text-[15px]">{profile.bio}</p>
        )}

        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>Se unió en {format(new Date(profile.created_at), "MMMM yyyy", { locale: es })}</span>
        </div>

        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <strong>{counts?.following ?? 0}</strong>{" "}
            <span className="text-muted-foreground">Siguiendo</span>
          </span>
          <span>
            <strong>{counts?.followers ?? 0}</strong>{" "}
            <span className="text-muted-foreground">Seguidores</span>
          </span>
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileDialog
          profile={profile}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
