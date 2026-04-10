import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useIsFollowing, useFollow, useFollowCounts } from "./use-follows";
import { createWrapper, createTestQueryClient } from "@/test/wrappers";
import { createMockSupabaseClient } from "@/test/mocks/supabase";

const { client: mockClient, mockChain } = createMockSupabaseClient();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

beforeEach(() => {
  vi.clearAllMocks();

  // Reset defaults
  mockChain.select.mockReturnThis();
  mockChain.eq.mockReturnThis();
  mockChain.in.mockReturnThis();
  mockChain.single.mockResolvedValue({ data: null, error: null });
  mockChain.then = vi.fn((resolve: (value: unknown) => void) =>
    resolve({ data: [], error: null, count: 0 })
  );
});

describe("useIsFollowing", () => {
  it("returns true when follow relationship exists", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: { follower_id: "user-123" },
      error: null,
    });

    const { result } = renderHook(() => useIsFollowing("target-456"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(true);
  });

  it("returns false when no follow relationship", async () => {
    mockChain.single.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const { result } = renderHook(() => useIsFollowing("target-456"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(false);
  });

  it("returns false when not authenticated", async () => {
    const { result } = renderHook(() => useIsFollowing("target-456"), {
      wrapper: createWrapper({ user: null, profile: null, effectiveProfileId: undefined }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(false);
  });
});

describe("useFollow", () => {
  it("calls insert when following (isFollowing = false)", async () => {
    mockChain.insert.mockReturnThis();
    mockChain.then = vi.fn((resolve: (value: unknown) => void) =>
      resolve({ data: null, error: null })
    );

    const { result } = renderHook(() => useFollow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ targetUserId: "target-456", isFollowing: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockClient.from).toHaveBeenCalledWith("follows");
    expect(mockChain.insert).toHaveBeenCalledWith({
      follower_id: "user-123",
      following_id: "target-456",
    });
  });

  it("calls delete when unfollowing (isFollowing = true)", async () => {
    mockChain.delete.mockReturnThis();
    mockChain.eq.mockReturnThis();
    mockChain.then = vi.fn((resolve: (value: unknown) => void) =>
      resolve({ data: null, error: null })
    );

    const { result } = renderHook(() => useFollow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ targetUserId: "target-456", isFollowing: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockChain.delete).toHaveBeenCalled();
  });

  it("throws when not authenticated", async () => {
    const { result } = renderHook(() => useFollow(), {
      wrapper: createWrapper({ user: null, profile: null, effectiveProfileId: undefined }),
    });

    await act(async () => {
      result.current.mutate({ targetUserId: "target-456", isFollowing: false });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Not authenticated");
  });

  it("performs optimistic update on mutate", async () => {
    const queryClient = createTestQueryClient();

    // Pre-seed the cache: user is NOT following target
    queryClient.setQueryData(["following", "target-456", "user-123"], false);
    queryClient.setQueryData(["follow-counts", "target-456"], {
      followers: 10,
      following: 5,
    });

    // Make the mutation hang so we can inspect the optimistic state
    mockChain.insert.mockReturnThis();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockChain.then = vi.fn(() => new Promise(() => {})) as any;

    const { result } = renderHook(() => useFollow(), {
      wrapper: createWrapper({ queryClient }),
    });

    await act(async () => {
      result.current.mutate({ targetUserId: "target-456", isFollowing: false });
    });

    // Check the optimistic cache update
    const followState = queryClient.getQueryData(["following", "target-456", "user-123"]);
    expect(followState).toBe(true);

    const counts = queryClient.getQueryData<{ followers: number }>(["follow-counts", "target-456"]);
    expect(counts?.followers).toBe(11);
  });
});

describe("useFollowCounts", () => {
  it("returns follower and following counts", async () => {
    // Mock two parallel Promise.all calls
    let callCount = 0;
    mockChain.then = vi.fn((resolve: (value: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return resolve({ data: null, error: null, count: 42 });
      }
      return resolve({ data: null, error: null, count: 7 });
    });

    const { result } = renderHook(() => useFollowCounts("target-456"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ followers: 42, following: 7 });
  });

  it("is disabled when userId is empty", () => {
    const { result } = renderHook(() => useFollowCounts(""), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
  });
});
