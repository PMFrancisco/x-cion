import { describe, it, expect, vi, beforeEach } from "vitest";
import { enrichPosts } from "./post-helpers";
import { createMockSupabaseClient } from "@/test/mocks/supabase";
import { makeRawPost, makeProfile } from "@/test/fixtures";

const { client: mockClient, mockChain } = createMockSupabaseClient();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => mockClient,
}));

beforeEach(() => {
  vi.clearAllMocks();

  // Reset default chain behavior
  mockChain.select.mockReturnThis();
  mockChain.in.mockReturnThis();
  mockChain.then = vi.fn((resolve: (value: unknown) => void) => resolve({ data: [], error: null }));
});

describe("enrichPosts", () => {
  it("returns empty array for empty input without calling Supabase", async () => {
    const result = await enrichPosts([], "user-1");

    expect(result).toEqual([]);
    expect(mockClient.from).not.toHaveBeenCalled();
  });

  it("returns zeroed counts when no interactions exist", async () => {
    const rawPost = makeRawPost({ id: "p1", likes: [], bookmarks: [] });

    const result = await enrichPosts([rawPost], "user-1");

    expect(result).toHaveLength(1);
    expect(result[0].like_count).toBe(0);
    expect(result[0].reply_count).toBe(0);
    expect(result[0].repost_count).toBe(0);
    expect(result[0].is_liked).toBe(false);
    expect(result[0].is_bookmarked).toBe(false);
    expect(result[0].is_replied).toBe(false);
  });

  it("counts likes from the embedded likes array", async () => {
    const rawPost = makeRawPost({
      id: "p1",
      likes: [{ user_id: "u1" }, { user_id: "u2" }, { user_id: "u3" }],
    });

    const result = await enrichPosts([rawPost], "u1");

    expect(result[0].like_count).toBe(3);
    expect(result[0].is_liked).toBe(true);
  });

  it("sets is_liked to false when currentUserId has not liked", async () => {
    const rawPost = makeRawPost({
      id: "p1",
      likes: [{ user_id: "other-user" }],
    });

    const result = await enrichPosts([rawPost], "current-user");

    expect(result[0].like_count).toBe(1);
    expect(result[0].is_liked).toBe(false);
  });

  it("sets is_bookmarked based on currentUserId", async () => {
    const rawPost = makeRawPost({
      id: "p1",
      bookmarks: [{ user_id: "current-user" }],
    });

    const result = await enrichPosts([rawPost], "current-user");

    expect(result[0].is_bookmarked).toBe(true);
  });

  it("counts replies from the Supabase query", async () => {
    const rawPost = makeRawPost({ id: "p1" });

    // First .from("posts") call returns replies, second returns reposts
    let callCount = 0;
    mockChain.then = vi.fn((resolve: (value: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        // Replies query
        return resolve({
          data: [
            { parent_id: "p1", author_id: "u2" },
            { parent_id: "p1", author_id: "u3" },
          ],
          error: null,
        });
      }
      // Reposts query
      return resolve({ data: [], error: null });
    });

    const result = await enrichPosts([rawPost], "u1");

    expect(result[0].reply_count).toBe(2);
    expect(result[0].is_replied).toBe(false);
  });

  it("sets is_replied when currentUserId has replied", async () => {
    const rawPost = makeRawPost({ id: "p1" });

    let callCount = 0;
    mockChain.then = vi.fn((resolve: (value: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return resolve({
          data: [{ parent_id: "p1", author_id: "current-user" }],
          error: null,
        });
      }
      return resolve({ data: [], error: null });
    });

    const result = await enrichPosts([rawPost], "current-user");

    expect(result[0].is_replied).toBe(true);
    expect(result[0].reply_count).toBe(1);
  });

  it("counts reposts from the Supabase query", async () => {
    const rawPost = makeRawPost({ id: "p1" });

    let callCount = 0;
    mockChain.then = vi.fn((resolve: (value: unknown) => void) => {
      callCount++;
      if (callCount === 1) {
        return resolve({ data: [], error: null });
      }
      return resolve({
        data: [{ repost_of: "p1" }, { repost_of: "p1" }],
        error: null,
      });
    });

    const result = await enrichPosts([rawPost], "u1");

    expect(result[0].repost_count).toBe(2);
  });

  it("sets all is_* flags to false when no currentUserId", async () => {
    const rawPost = makeRawPost({
      id: "p1",
      likes: [{ user_id: "u1" }],
      bookmarks: [{ user_id: "u1" }],
    });

    const result = await enrichPosts([rawPost], undefined);

    expect(result[0].is_liked).toBe(false);
    expect(result[0].is_bookmarked).toBe(false);
    expect(result[0].is_replied).toBe(false);
  });

  it("preserves post content and author data", async () => {
    const author = makeProfile({ id: "a1", username: "testauthor" });
    const rawPost = makeRawPost({
      id: "p1",
      content: "Test content",
      author,
      author_id: "a1",
      media_urls: ["img1.jpg"],
    });

    const result = await enrichPosts([rawPost], "u1");

    expect(result[0].content).toBe("Test content");
    expect(result[0].author.username).toBe("testauthor");
    expect(result[0].media_urls).toEqual(["img1.jpg"]);
  });
});
