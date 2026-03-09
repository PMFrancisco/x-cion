-- ============================================
-- Xcion - Notification Triggers
-- Auto-create notifications for likes, follows,
-- replies, and @mentions.
-- Run this in Supabase Dashboard SQL Editor
-- ============================================
-- IMPORTANT: After running this migration, enable
-- Realtime for the notifications table in the
-- Supabase Dashboard: Database > Replication >
-- enable "notifications".
-- ============================================

-- =====================
-- 1. LIKE NOTIFICATION
-- =====================

CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS trigger AS $$
DECLARE
  post_author_id uuid;
BEGIN
  SELECT author_id INTO post_author_id
  FROM posts WHERE id = NEW.post_id;

  IF post_author_id IS NOT NULL AND post_author_id != NEW.user_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, post_id)
    VALUES (post_author_id, NEW.user_id, 'like', NEW.post_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_on_like
  AFTER INSERT ON likes
  FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- =====================
-- 2. FOLLOW NOTIFICATION
-- =====================

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_on_follow
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- =====================
-- 3. REPLY + MENTION NOTIFICATION
-- =====================

CREATE OR REPLACE FUNCTION notify_on_post()
RETURNS trigger AS $$
DECLARE
  parent_author_id uuid;
  mentioned_user record;
  notified_ids uuid[] := '{}';
BEGIN
  -- Reply notification
  IF NEW.parent_id IS NOT NULL THEN
    SELECT author_id INTO parent_author_id
    FROM posts WHERE id = NEW.parent_id;

    IF parent_author_id IS NOT NULL AND parent_author_id != NEW.author_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, post_id)
      VALUES (parent_author_id, NEW.author_id, 'reply', NEW.id);

      notified_ids := array_append(notified_ids, parent_author_id);
    END IF;
  END IF;

  -- Mention notifications
  FOR mentioned_user IN
    SELECT DISTINCT p.id, p.username
    FROM regexp_matches(NEW.content, '@(\w+)', 'g') AS m
    JOIN profiles p ON lower(p.username) = lower(m[1])
    WHERE p.id != NEW.author_id
      AND p.id != ALL(notified_ids)
  LOOP
    INSERT INTO notifications (recipient_id, actor_id, type, post_id)
    VALUES (mentioned_user.id, NEW.author_id, 'mention', NEW.id);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_on_post
  AFTER INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION notify_on_post();
