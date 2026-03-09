-- ============================================
-- Xcion - Hashtag System
-- Tables, trigger, trending function, and backfill
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- =====================
-- 1. TABLES
-- =====================

CREATE TABLE hashtags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE post_hashtags (
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id uuid REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, hashtag_id)
);

-- =====================
-- 2. INDEXES
-- =====================

CREATE INDEX idx_hashtags_name ON hashtags (name);
CREATE INDEX idx_post_hashtags_hashtag_created ON post_hashtags (hashtag_id, created_at DESC);
CREATE INDEX idx_post_hashtags_post ON post_hashtags (post_id);

-- =====================
-- 3. RLS
-- =====================

ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hashtags are viewable by everyone"
  ON hashtags FOR SELECT USING (true);

CREATE POLICY "Post hashtags are viewable by everyone"
  ON post_hashtags FOR SELECT USING (true);

-- =====================
-- 4. EXTRACTION TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION extract_hashtags()
RETURNS trigger AS $$
DECLARE
  tag text;
BEGIN
  DELETE FROM post_hashtags WHERE post_id = NEW.id;

  FOR tag IN
    SELECT DISTINCT lower(m[1])
    FROM regexp_matches(NEW.content, '#(\w+)', 'g') AS m
  LOOP
    INSERT INTO hashtags (name)
    VALUES (tag)
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO post_hashtags (post_id, hashtag_id)
    SELECT NEW.id, h.id
    FROM hashtags h
    WHERE h.name = tag
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_extract_hashtags
  AFTER INSERT OR UPDATE OF content ON posts
  FOR EACH ROW EXECUTE FUNCTION extract_hashtags();

-- =====================
-- 5. TRENDING FUNCTION
-- =====================

CREATE OR REPLACE FUNCTION trending_hashtags(
  hours int DEFAULT 24,
  lim int DEFAULT 5
)
RETURNS TABLE (name text, post_count bigint) AS $$
  SELECT h.name, count(*) AS post_count
  FROM post_hashtags ph
  JOIN hashtags h ON h.id = ph.hashtag_id
  WHERE ph.created_at > now() - make_interval(hours => hours)
  GROUP BY h.name
  ORDER BY post_count DESC, h.name
  LIMIT lim;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================
-- 6. BACKFILL EXISTING POSTS
-- =====================

UPDATE posts SET content = content WHERE content LIKE '%#%';
