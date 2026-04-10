-- ============================================================
-- 009_polls.sql — Polls feature: tables, indexes, RLS, trigger, RPC
-- ============================================================

-- ---------- Tables ----------

CREATE TABLE polls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE poll_options (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL CHECK (char_length(label) <= 80),
  position smallint NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (poll_id, position)
);

CREATE TABLE poll_votes (
  poll_id uuid REFERENCES polls(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  option_id uuid REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (poll_id, user_id)
);

-- ---------- Indexes ----------

CREATE INDEX idx_polls_post ON polls(post_id);
CREATE INDEX idx_polls_expires ON polls(expires_at);
CREATE INDEX idx_poll_options_poll ON poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll ON poll_votes(poll_id);
CREATE INDEX idx_poll_votes_option ON poll_votes(option_id);
CREATE INDEX idx_poll_votes_user ON poll_votes(user_id);

-- ---------- RLS ----------

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls: readable by everyone
CREATE POLICY "Polls are viewable by everyone"
  ON polls FOR SELECT USING (true);

-- Polls: creatable by post author or admin-as-NPC
CREATE POLICY "Post authors can create polls"
  ON polls FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND (
        author_id = auth.uid()
        OR (is_admin() AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id AND is_npc = true))
      )
    )
  );

-- Polls: deletable by post author or admin
CREATE POLICY "Post authors can delete polls"
  ON polls FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM posts WHERE id = post_id AND (
        author_id = auth.uid() OR is_admin()
      )
    )
  );

-- Poll options: readable by everyone
CREATE POLICY "Poll options are viewable by everyone"
  ON poll_options FOR SELECT USING (true);

-- Poll options: creatable by poll creator
CREATE POLICY "Poll creators can add options"
  ON poll_options FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN posts po ON po.id = p.post_id
      WHERE p.id = poll_id AND (
        po.author_id = auth.uid()
        OR (is_admin() AND EXISTS (SELECT 1 FROM profiles WHERE id = po.author_id AND is_npc = true))
      )
    )
  );

-- Poll votes: readable by everyone
CREATE POLICY "Poll votes are viewable by everyone"
  ON poll_votes FOR SELECT USING (true);

-- Poll votes: users can vote (or admin-as-NPC)
CREATE POLICY "Users can vote on polls"
  ON poll_votes FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR (
      is_admin()
      AND EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND is_npc = true)
    )
  );

-- ---------- Trigger: prevent voting on expired polls ----------

CREATE OR REPLACE FUNCTION check_poll_not_expired()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM polls WHERE id = NEW.poll_id AND expires_at <= now()) THEN
    RAISE EXCEPTION 'Poll has expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_poll_not_expired
  BEFORE INSERT ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION check_poll_not_expired();

-- ---------- RPC: get poll results ----------

CREATE OR REPLACE FUNCTION get_poll_results(p_poll_id uuid)
RETURNS TABLE (
  option_id uuid,
  "label" text,
  "position" smallint,
  vote_count bigint
) AS $$
  SELECT
    po.id AS option_id,
    po.label,
    po.position,
    count(pv.user_id) AS vote_count
  FROM poll_options po
  LEFT JOIN poll_votes pv ON pv.option_id = po.id
  WHERE po.poll_id = p_poll_id
  GROUP BY po.id, po.label, po.position
  ORDER BY po.position;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
