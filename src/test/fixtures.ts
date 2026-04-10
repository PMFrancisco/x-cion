import type { Profile, PostWithCounts, PollWithOptions, PollOptionWithCount } from "@/lib/types";
import type { RawPost } from "@/lib/post-helpers";

export function makeProfile(overrides?: Partial<Profile>): Profile {
  return {
    id: "profile-1",
    username: "defaultuser",
    display_name: "Default User",
    bio: "",
    avatar_url: null,
    banner_url: null,
    role: "user",
    is_npc: false,
    created_by: null,
    onboarding_completed: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makePost(overrides?: Partial<PostWithCounts>): PostWithCounts {
  const author = makeProfile();
  return {
    id: "post-1",
    author_id: author.id,
    content: "Hello world",
    media_urls: [],
    parent_id: null,
    repost_of: null,
    created_at: "2025-06-01T12:00:00Z",
    updated_at: "2025-06-01T12:00:00Z",
    author,
    like_count: 0,
    reply_count: 0,
    repost_count: 0,
    is_liked: false,
    is_bookmarked: false,
    is_reposted: false,
    is_replied: false,
    poll: null,
    ...overrides,
  };
}

export function makePollOption(overrides?: Partial<PollOptionWithCount>): PollOptionWithCount {
  return {
    id: "option-1",
    poll_id: "poll-1",
    label: "Option A",
    position: 0,
    vote_count: 0,
    created_at: "2025-06-01T12:00:00Z",
    ...overrides,
  };
}

export function makePoll(overrides?: Partial<PollWithOptions>): PollWithOptions {
  return {
    id: "poll-1",
    post_id: "post-1",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: "2025-06-01T12:00:00Z",
    options: [
      makePollOption({ id: "option-1", label: "Option A", position: 0 }),
      makePollOption({ id: "option-2", label: "Option B", position: 1 }),
    ],
    total_votes: 0,
    user_vote_option_id: null,
    is_expired: false,
    ...overrides,
  };
}

export function makeRawPost(overrides?: Partial<RawPost>): RawPost {
  const author = makeProfile();
  return {
    id: "post-1",
    author_id: author.id,
    content: "Hello world",
    media_urls: [],
    parent_id: null,
    repost_of: null,
    created_at: "2025-06-01T12:00:00Z",
    updated_at: "2025-06-01T12:00:00Z",
    author,
    likes: [],
    bookmarks: [],
    ...overrides,
  };
}
