"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  authError: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

const PROFILE_RETRY_DELAY = 500;
const PROFILE_MAX_ATTEMPTS = 2;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Effect 1: Auth state listener — synchronous only, no Supabase calls.
  // onAuthStateChange fires INITIAL_SESSION on subscribe, replacing getSession().
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setIsLoading(false);
        router.push("/login");
        return;
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Effect 2: Fetch profile when user changes — deferred, cancellable, with retry.
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setAuthError(null);

    const load = async () => {
      for (let attempt = 0; attempt < PROFILE_MAX_ATTEMPTS; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (cancelled) return;

        if (!error && data) {
          setProfile(data as Profile);
          setIsLoading(false);
          return;
        }

        if (attempt < PROFILE_MAX_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, PROFILE_RETRY_DELAY));
          if (cancelled) return;
        }
      }

      setProfile(null);
      setAuthError("Failed to load profile");
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, supabase]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    setAuthError(null);

    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    if (!error && data) {
      setProfile(data as Profile);
    } else {
      setAuthError("Failed to refresh profile");
    }
  }, [user, supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push("/login");
    router.refresh();
  }, [supabase, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === "admin",
        isLoading,
        authError,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
