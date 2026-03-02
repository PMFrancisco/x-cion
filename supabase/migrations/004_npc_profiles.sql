-- ============================================
-- Xcion - NPC Profiles & Possession System
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- =====================
-- 1. SCHEMA CHANGES
-- =====================

-- Drop the FK from profiles.id -> auth.users so NPC profiles can exist
-- without a corresponding auth user. Existing real-user profiles keep
-- their IDs unchanged.
ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;

-- Allow NPC profiles to get auto-generated UUIDs
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add NPC columns
ALTER TABLE profiles ADD COLUMN is_npc boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Index for quickly fetching all NPCs
CREATE INDEX idx_profiles_is_npc ON profiles(is_npc) WHERE is_npc = true;

-- =====================
-- 2. CASCADE TRIGGER
-- =====================
-- Replaces the old FK ON DELETE CASCADE: when an auth user is deleted,
-- delete their matching (non-NPC) profile.

CREATE OR REPLACE FUNCTION handle_auth_user_deleted()
RETURNS trigger AS $$
BEGIN
  DELETE FROM profiles WHERE id = old.id AND is_npc = false;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_deleted();

-- Update handle_new_user to set is_npc = false explicitly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, role, is_npc)
  VALUES (
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
    'user',
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- 3. PROFILES RLS
-- =====================

-- Admins can create NPC profiles
CREATE POLICY "Admins can create NPC profiles"
  ON profiles FOR INSERT WITH CHECK (
    is_admin() AND is_npc = true
  );

-- Admins can delete NPC profiles
CREATE POLICY "Admins can delete NPC profiles"
  ON profiles FOR DELETE USING (
    is_admin() AND is_npc = true
  );

-- =====================
-- 4. POSTS RLS
-- =====================

-- Replace the insert policy to also allow admins posting as NPCs
DROP POLICY "Authenticated users can create posts" ON posts;

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (
    auth.uid() = author_id
    OR (
      is_admin()
      AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id AND is_npc = true)
    )
  );

-- =====================
-- 5. LIKES RLS
-- =====================

-- Replace insert policy to allow admin-as-NPC likes
DROP POLICY "Users can like posts" ON likes;

CREATE POLICY "Users can like posts"
  ON likes FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR (
      is_admin()
      AND EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_npc = true)
    )
  );

-- Replace delete policy to allow admin-as-NPC unlikes
DROP POLICY "Users can unlike their own likes" ON likes;

CREATE POLICY "Users can unlike their own likes"
  ON likes FOR DELETE USING (
    auth.uid() = user_id
    OR (
      is_admin()
      AND EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_npc = true)
    )
  );

-- =====================
-- 6. FOLLOWS RLS
-- =====================

-- Replace insert policy to allow admin-as-NPC follows
DROP POLICY "Users can follow" ON follows;

CREATE POLICY "Users can follow"
  ON follows FOR INSERT WITH CHECK (
    auth.uid() = follower_id
    OR (
      is_admin()
      AND EXISTS (SELECT 1 FROM profiles WHERE id = follower_id AND is_npc = true)
    )
  );

-- Replace delete policy to allow admin-as-NPC unfollows
DROP POLICY "Users can unfollow" ON follows;

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (
    auth.uid() = follower_id
    OR (
      is_admin()
      AND EXISTS (SELECT 1 FROM profiles WHERE id = follower_id AND is_npc = true)
    )
  );
