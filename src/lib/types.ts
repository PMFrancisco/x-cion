export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  banner_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[];
  parent_id: string | null;
  repost_of: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  author: Profile;
}

export interface PostWithCounts extends PostWithAuthor {
  like_count: number;
  reply_count: number;
  repost_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_reposted: boolean;
}

export interface Like {
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Bookmark {
  user_id: string;
  post_id: string;
  created_at: string;
}

export type NotificationType =
  | "like"
  | "reply"
  | "follow"
  | "repost"
  | "mention";

export interface Notification {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
}

export interface ProfileWithCounts extends Profile {
  follower_count: number;
  following_count: number;
  post_count: number;
  is_following: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}
