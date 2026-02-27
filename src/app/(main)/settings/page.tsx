"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { validateUsername } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, refreshProfile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(sanitized);
    setUsernameError(validateUsername(sanitized));
  };

  const handleSave = async () => {
    if (!profile) return;

    const formatError = validateUsername(username);
    if (formatError) {
      setUsernameError(formatError);
      return;
    }

    setSaving(true);
    const supabase = createClient();

    if (username !== profile.username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .neq("id", profile.id)
        .maybeSingle();

      if (existing) {
        setUsernameError("Este handle ya está en uso");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        username,
        bio,
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Error al actualizar el perfil");
    } else {
      toast.success("Perfil actualizado");
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
    setSaving(false);
  };

  const hasUsernameChanged = username !== (profile?.username ?? "");
  const canSave = !usernameError && displayName.trim().length > 0 && !saving;

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
        <h1 className="text-xl font-bold">Configuración</h1>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Perfil</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre para mostrar</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Handle</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  @
                </span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="pl-7"
                  maxLength={15}
                />
              </div>
              {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
              {!usernameError && hasUsernameChanged && username.length >= 3 && (
                <p className="text-xs text-muted-foreground">Tu perfil estará en /{username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="resize-none"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">{bio.length}/160</p>
            </div>
            <Button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-xcion-blue text-white hover:bg-xcion-blue-hover"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-lg font-semibold mb-4">Apariencia</h2>
          <div className="flex gap-3">
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
            >
              Oscuro
            </Button>
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
            >
              Claro
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
            >
              Sistema
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-lg font-semibold mb-4">Cuenta</h2>
          <p className="text-sm text-muted-foreground mb-2">Rol: {profile?.role}</p>
          <Button variant="destructive" className="mt-4" onClick={signOut}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
