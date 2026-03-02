"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { validateUsername } from "@/lib/utils";
import { toast } from "sonner";

export default function OnboardingPage() {
  const { profile, refreshProfile, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (!initialized && profile) {
    setDisplayName(profile.display_name);
    setInitialized(true);
  }

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(sanitized);
    setUsernameError(validateUsername(sanitized));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    const formatError = validateUsername(username);
    if (formatError) {
      setUsernameError(formatError);
      return;
    }

    if (!displayName.trim()) return;

    setSaving(true);
    const supabase = createClient();

    try {
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

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          display_name: displayName,
          onboarding_completed: true,
        })
        .eq("id", profile.id);

      if (error) throw error;

      await refreshProfile();
      router.replace("/");
    } catch {
      toast.error("Error al configurar el perfil");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-xcion-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Configura tu perfil</h1>
        <p className="text-muted-foreground">Elige tu handle y nombre para empezar</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="onboardingUsername">Handle</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              @
            </span>
            <Input
              id="onboardingUsername"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className="pl-7"
              maxLength={15}
              placeholder="tu_handle"
              autoFocus
            />
          </div>
          {usernameError && <p className="text-xs text-destructive">{usernameError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="onboardingDisplayName">Nombre para mostrar</Label>
          <Input
            id="onboardingDisplayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-xcion-blue text-white hover:bg-xcion-blue-hover"
          disabled={saving || !username || !displayName.trim() || !!usernameError}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Continuar
        </Button>
      </form>
    </div>
  );
}
