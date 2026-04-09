import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/components/providers/auth-provider";
import type { Profile } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { vi } from "vitest";

export const mockProfile: Profile = {
  id: "user-123",
  username: "testuser",
  display_name: "Test User",
  bio: "A test user",
  avatar_url: null,
  banner_url: null,
  role: "user",
  is_npc: false,
  created_by: null,
  onboarding_completed: true,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const mockUser = {
  id: "user-123",
  email: "test@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: "2025-01-01T00:00:00Z",
} as User;

interface WrapperOptions {
  profile?: Profile | null;
  user?: User | null;
  effectiveProfileId?: string;
  isAdmin?: boolean;
  isPossessing?: boolean;
  queryClient?: QueryClient;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function createWrapper(options: WrapperOptions = {}) {
  const {
    profile = mockProfile,
    user = mockUser,
    effectiveProfileId = profile?.id,
    isAdmin = false,
    isPossessing = false,
    queryClient = createTestQueryClient(),
  } = options;

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider
          value={{
            user,
            profile,
            isAdmin,
            isLoading: false,
            needsOnboarding: false,
            authError: null,
            signOut: vi.fn(),
            refreshProfile: vi.fn(),
            actingAs: null,
            effectiveProfileId,
            effectiveProfile: profile,
            isPossessing,
            possess: vi.fn(),
            unpossess: vi.fn(),
          }}
        >
          {children}
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}
