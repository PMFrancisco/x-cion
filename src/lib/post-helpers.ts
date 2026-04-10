import { createClient } from "@/lib/supabase/client";
import type {
  Post,
  Profile,
  PostWithCounts,
  PollWithOptions,
  PollOptionWithCount,
} from "@/lib/types";

export type RawPost = Post & {
  author: Profile;
  likes?: { user_id: string }[];
  bookmarks?: { user_id: string }[];
};

/**
 * Fetches reply/repost counts, poll data, and maps raw post rows to PostWithCounts[].
 */
export async function enrichPosts(
  rows: RawPost[],
  currentUserId?: string
): Promise<PostWithCounts[]> {
  const postIds = rows.map((p) => p.id);

  const replyCounts: Record<string, number> = {};
  const repostCounts: Record<string, number> = {};
  const userReplied: Set<string> = new Set();
  const pollByPostId: Record<string, PollWithOptions> = {};

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

    // Batch-fetch polls for these posts
    const { data: polls } = await supabase.from("polls").select("*").in("post_id", postIds);

    const pollRows = polls ?? [];
    const pollIds = pollRows.map((p: { id: string }) => p.id);

    if (pollIds.length > 0) {
      const [{ data: options }, { data: votes }, userVotesResult] = await Promise.all([
        supabase.from("poll_options").select("*").in("poll_id", pollIds).order("position"),
        supabase.from("poll_votes").select("poll_id, option_id").in("poll_id", pollIds),
        currentUserId
          ? supabase
              .from("poll_votes")
              .select("poll_id, option_id")
              .in("poll_id", pollIds)
              .eq("user_id", currentUserId)
          : Promise.resolve({ data: [] as { poll_id: string; option_id: string }[] }),
      ]);

      // Count votes per option
      const voteCountByOption: Record<string, number> = {};
      const totalVotesByPoll: Record<string, number> = {};
      (votes ?? []).forEach((v: { poll_id: string; option_id: string }) => {
        voteCountByOption[v.option_id] = (voteCountByOption[v.option_id] ?? 0) + 1;
        totalVotesByPoll[v.poll_id] = (totalVotesByPoll[v.poll_id] ?? 0) + 1;
      });

      // User's votes
      const userVoteByPoll: Record<string, string> = {};
      (
        (userVotesResult as { data: { poll_id: string; option_id: string }[] | null }).data ?? []
      ).forEach((v: { poll_id: string; option_id: string }) => {
        userVoteByPoll[v.poll_id] = v.option_id;
      });

      // Group options by poll
      const optionsByPoll: Record<string, PollOptionWithCount[]> = {};
      (options ?? []).forEach(
        (opt: {
          id: string;
          poll_id: string;
          label: string;
          position: number;
          created_at: string;
        }) => {
          if (!optionsByPoll[opt.poll_id]) optionsByPoll[opt.poll_id] = [];
          optionsByPoll[opt.poll_id].push({
            id: opt.id,
            poll_id: opt.poll_id,
            label: opt.label,
            position: opt.position,
            created_at: opt.created_at,
            vote_count: voteCountByOption[opt.id] ?? 0,
          });
        }
      );

      // Assemble PollWithOptions
      pollRows.forEach(
        (poll: { id: string; post_id: string; expires_at: string; created_at: string }) => {
          pollByPostId[poll.post_id] = {
            id: poll.id,
            post_id: poll.post_id,
            expires_at: poll.expires_at,
            created_at: poll.created_at,
            options: optionsByPoll[poll.id] ?? [],
            total_votes: totalVotesByPoll[poll.id] ?? 0,
            user_vote_option_id: userVoteByPoll[poll.id] ?? null,
            is_expired: new Date(poll.expires_at) <= new Date(),
          };
        }
      );
    }
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
    poll: pollByPostId[post.id] ?? null,
  }));
}
