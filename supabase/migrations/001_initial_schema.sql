-- ============================================
-- Xcion - Initial Database Schema
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- Role enum
create type user_role as enum ('user', 'admin');

-- =====================
-- PROFILES
-- =====================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text not null,
  bio text default '',
  avatar_url text,
  banner_url text,
  role user_role default 'user' not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- POSTS
-- =====================
create table posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 280),
  media_urls text[] default '{}',
  parent_id uuid references posts(id) on delete cascade,
  repost_of uuid references posts(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- LIKES
-- =====================
create table likes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- =====================
-- FOLLOWS
-- =====================
create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id != following_id)
);

-- =====================
-- BOOKMARKS
-- =====================
create table bookmarks (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- =====================
-- NOTIFICATIONS
-- =====================
create table notifications (
  id uuid default gen_random_uuid() primary key,
  recipient_id uuid references profiles(id) on delete cascade not null,
  actor_id uuid references profiles(id) on delete cascade not null,
  type text not null check (type in ('like', 'reply', 'follow', 'repost', 'mention')),
  post_id uuid references posts(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);

-- =====================
-- INDEXES
-- =====================
create index idx_posts_author on posts(author_id);
create index idx_posts_created on posts(created_at desc);
create index idx_posts_parent on posts(parent_id) where parent_id is not null;
create index idx_posts_repost on posts(repost_of) where repost_of is not null;
create index idx_likes_post on likes(post_id);
create index idx_likes_user on likes(user_id);
create index idx_follows_following on follows(following_id);
create index idx_follows_follower on follows(follower_id);
create index idx_bookmarks_user on bookmarks(user_id);
create index idx_bookmarks_post on bookmarks(post_id);
create index idx_notifications_recipient on notifications(recipient_id, read, created_at desc);

-- =====================
-- FUNCTIONS
-- =====================

-- Check if current user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 4)
    ),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    ),
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

alter table profiles enable row level security;
alter table posts enable row level security;
alter table likes enable row level security;
alter table follows enable row level security;
alter table bookmarks enable row level security;
alter table notifications enable row level security;

-- PROFILES policies
create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update using (is_admin());

-- POSTS policies
create policy "Posts are viewable by everyone"
  on posts for select using (true);

create policy "Authenticated users can create posts"
  on posts for insert with check (auth.uid() = author_id);

create policy "Users can update own posts"
  on posts for update using (auth.uid() = author_id);

create policy "Admins can update any post"
  on posts for update using (is_admin());

create policy "Users can delete own posts"
  on posts for delete using (auth.uid() = author_id);

create policy "Admins can delete any post"
  on posts for delete using (is_admin());

-- LIKES policies
create policy "Likes are viewable by everyone"
  on likes for select using (true);

create policy "Users can like posts"
  on likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike their own likes"
  on likes for delete using (auth.uid() = user_id);

-- FOLLOWS policies
create policy "Follows are viewable by everyone"
  on follows for select using (true);

create policy "Users can follow"
  on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on follows for delete using (auth.uid() = follower_id);

-- BOOKMARKS policies
create policy "Users can view own bookmarks"
  on bookmarks for select using (auth.uid() = user_id);

create policy "Users can bookmark"
  on bookmarks for insert with check (auth.uid() = user_id);

create policy "Users can remove own bookmarks"
  on bookmarks for delete using (auth.uid() = user_id);

-- NOTIFICATIONS policies
create policy "Users can view own notifications"
  on notifications for select using (auth.uid() = recipient_id);

create policy "Authenticated users can create notifications"
  on notifications for insert with check (auth.uid() = actor_id);

create policy "Users can update own notifications"
  on notifications for update using (auth.uid() = recipient_id);

-- =====================
-- STORAGE BUCKETS
-- =====================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
insert into storage.buckets (id, name, public) values ('banners', 'banners', true);
insert into storage.buckets (id, name, public) values ('post-media', 'post-media', true);

-- Storage policies
create policy "Anyone can view avatars"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Authenticated users can upload avatars"
  on storage.objects for insert with check (
    bucket_id = 'avatars' and auth.role() = 'authenticated'
  );

create policy "Users can update own avatars"
  on storage.objects for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view banners"
  on storage.objects for select using (bucket_id = 'banners');

create policy "Authenticated users can upload banners"
  on storage.objects for insert with check (
    bucket_id = 'banners' and auth.role() = 'authenticated'
  );

create policy "Users can update own banners"
  on storage.objects for update using (
    bucket_id = 'banners' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Anyone can view post media"
  on storage.objects for select using (bucket_id = 'post-media');

create policy "Authenticated users can upload post media"
  on storage.objects for insert with check (
    bucket_id = 'post-media' and auth.role() = 'authenticated'
  );

create policy "Users can delete own post media"
  on storage.objects for delete using (
    bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text
  );
