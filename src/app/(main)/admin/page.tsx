"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Bot, Loader2, MoreVertical, Shield, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import type { Profile, UserRole } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_npc", false)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const supabase = createClient();
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Rol actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar el rol");
    },
  });

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-6 backdrop-blur-md bg-background/80 border-b px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Panel de administración</h1>
          <p className="text-sm text-muted-foreground">{users?.length ?? 0} usuarios</p>
        </div>
      </div>

      <Link
        href="/admin/npcs"
        className="flex items-center gap-3 px-4 py-3 border-b hover:bg-accent/50 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-xcion-primary/10">
          <Bot className="h-5 w-5 text-xcion-primary" />
        </div>
        <div className="flex-1">
          <span className="font-semibold">Gestionar NPCs</span>
          <p className="text-sm text-muted-foreground">Crear, editar y poseer personajes</p>
        </div>
        <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
      </Link>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-xcion-primary" />
        </div>
      ) : (
        <div className="divide-y">
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback>{getInitials(user.display_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{user.display_name}</span>
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {user.role === "admin" && <Shield className="mr-1 h-3 w-3" />}
                      {user.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {user.role === "admin" ? (
                    <DropdownMenuItem
                      onClick={() =>
                        changeRoleMutation.mutate({
                          userId: user.id,
                          newRole: "user",
                        })
                      }
                    >
                      <User className="mr-2 h-4 w-4" />
                      Degradar a usuario
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() =>
                        changeRoleMutation.mutate({
                          userId: user.id,
                          newRole: "admin",
                        })
                      }
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Promover a admin
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
