"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  needsOnboarding: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  isLoading: true,
  needsOnboarding: false,
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
      if (event === "INITIAL_SESSION" && !session) {
        setIsLoading(false);
        return;
      }
      const newUser = session?.user ?? null;
      setUser((prev) => {
        if (prev?.id === newUser?.id) return prev;
        return newUser;
      });
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setAuthError(null);

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
  }, [supabase, router]);

  const needsOnboarding = !!profile && !profile.onboarding_completed;
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const isOnboardingPage = pathname === "/onboarding";

    if (needsOnboarding && !isOnboardingPage) {
      router.replace("/onboarding");
    } else if (!needsOnboarding && isOnboardingPage && profile) {
      router.replace("/");
    }
  }, [needsOnboarding, pathname, isLoading, profile, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === "admin",
        isLoading,
        needsOnboarding,
        authError,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
