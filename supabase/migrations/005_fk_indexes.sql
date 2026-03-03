-- ============================================
-- Xcion - Missing FK & Composite Indexes
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- Indexes on foreign key columns that were missing indexes.
-- Without these, CASCADE deletes on the parent table cause
-- sequential scans and can hold table-level locks.

CREATE INDEX IF NOT EXISTS idx_notifications_actor
  ON notifications (actor_id);

CREATE INDEX IF NOT EXISTS idx_notifications_post
  ON notifications (post_id);

CREATE INDEX IF NOT EXISTS idx_profiles_created_by
  ON profiles (created_by) WHERE created_by IS NOT NULL;

-- Composite index for the home feed query which filters by
-- author_id IN (...) and orders by created_at DESC.
-- Supersedes the single-column idx_posts_author.

CREATE INDEX IF NOT EXISTS idx_posts_author_created
  ON posts (author_id, created_at DESC);
