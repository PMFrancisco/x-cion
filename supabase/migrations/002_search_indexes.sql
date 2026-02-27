-- ============================================
-- Xcion - Search Indexes
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- Enable pg_trgm for partial text matching
create extension if not exists pg_trgm;

-- Trigram GIN indexes for ILIKE search performance
create index idx_posts_content_trgm on posts using gin (content gin_trgm_ops);
create index idx_profiles_username_trgm on profiles using gin (username gin_trgm_ops);
create index idx_profiles_display_name_trgm on profiles using gin (display_name gin_trgm_ops);
