import { createClient } from "@/lib/supabase/client";
import type { Post, Profile, PostWithCounts } from "@/lib/types";

export type RawPost = Post & {
  author: Profile;
  likes?: { user_id: string }[];
  bookmarks?: { user_id: string }[];
};

/**
 * Fetches reply/repost counts and maps raw post rows to PostWithCounts[].
 */
export async function enrichPosts(
  rows: RawPost[],
  currentUserId?: string
): Promise<PostWithCounts[]> {
  const postIds = rows.map((p) => p.id);

  const replyCounts: Record<string, number> = {};
  const repostCounts: Record<string, number> = {};
  const userReplied: Set<string> = new Set();

  if (postIds.length > 0) {
    const supabase = createClient();

    const { data: replies } = await supabase
      .from("posts")
      .select("parent_id, author_id")
      .in("parent_id", postIds);

    (replies ?? []).forEach((r: { parent_id: string | null; author_id: string }) => {
      if (r.parent_id) {
        replyCounts[r.parent_id] = (replyCounts[r.parent_id] ?? 0) + 1;
        if (r.author_id === currentUserId) userReplied.add(r.parent_id);
      }
    });

    const { data: reposts } = await supabase
      .from("posts")
      .select("repost_of")
      .in("repost_of", postIds);

    (reposts ?? []).forEach((r: { repost_of: string | null }) => {
      if (r.repost_of) repostCounts[r.repost_of] = (repostCounts[r.repost_of] ?? 0) + 1;
    });
  }

  return rows.map((post) => ({
    id: post.id,
    author_id: post.author_id,
    content: post.content,
    media_urls: post.media_urls,
    parent_id: post.parent_id,
    repost_of: post.repost_of,
    created_at: post.created_at,
    updated_at: post.updated_at,
    author: post.author,
    like_count: post.likes?.length ?? 0,
    reply_count: replyCounts[post.id] ?? 0,
    repost_count: repostCounts[post.id] ?? 0,
    is_liked: post.likes?.some((l) => l.user_id === currentUserId) ?? false,
    is_bookmarked: post.bookmarks?.some((b) => b.user_id === currentUserId) ?? false,
    is_reposted: false,
    is_replied: userReplied.has(post.id),
  }));
}
