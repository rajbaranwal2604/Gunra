/*
# Gunra College Community - Initial Schema

## Overview
Creates the full database schema for Gunra, a college community platform with
single-player games (with leaderboards and stats), user profiles with followers/following,
and an open community feed with posts, comments, and likes.

## New Tables

1. **profiles** — Public profile data for each user (extends auth.users)
   - id (uuid, PK, FK to auth.users)
   - username (text, unique, not null)
   - full_name (text)
   - bio (text)
   - avatar_url (text)
   - college (text)
   - created_at (timestamptz)

2. **games** — Catalog of single-player games (added manually)
   - id (uuid, PK)
   - title (text, unique, not null)
   - description (text)
   - slug (text, unique, not null) — maps to frontend game component
   - icon_name (text) — lucide icon name
   - created_at (timestamptz)

3. **game_scores** — Score entries for leaderboards
   - id (uuid, PK)
   - game_id (uuid, FK to games)
   - user_id (uuid, FK to auth.users, defaults to auth.uid())
   - score (integer, not null)
   - created_at (timestamptz)

4. **posts** — Community feed posts
   - id (uuid, PK)
   - user_id (uuid, FK to auth.users, defaults to auth.uid())
   - content (text, not null)
   - created_at (timestamptz)

5. **comments** — Comments on posts
   - id (uuid, PK)
   - post_id (uuid, FK to posts, cascade delete)
   - user_id (uuid, FK to auth.users, defaults to auth.uid())
   - content (text, not null)
   - created_at (timestamptz)

6. **likes** — Likes on posts (one like per user per post)
   - id (uuid, PK)
   - post_id (uuid, FK to posts, cascade delete)
   - user_id (uuid, FK to auth.users, defaults to auth.uid())
   - created_at (timestamptz)

7. **follows** — Follower/following relationships
   - id (uuid, PK)
   - follower_id (uuid, FK to auth.users) — the user who follows
   - following_id (uuid, FK to auth.users) — the user being followed
   - created_at (timestamptz)
   - Unique constraint on (follower_id, following_id)

## Security (RLS)
- All tables have RLS enabled.
- profiles: all authenticated users can read; users can update only their own.
- games: all authenticated users can read and insert.
- game_scores: all authenticated users can read; users can insert only their own.
- posts: all authenticated users can read; users can insert/update/delete only their own.
- comments: all authenticated users can read; users can insert/delete only their own.
- likes: all authenticated users can read; users can insert/delete only their own.
- follows: all authenticated users can read; users can insert/delete only their own (as follower).

## Notes
1. This app has a sign-in screen, so all policies are scoped to `authenticated`.
2. Owner columns default to `auth.uid()` so client inserts work without passing user_id.
3. A trigger auto-creates a profile row when a new auth.users row is inserted.
*/

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  college text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- GAMES
-- ============================================================
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text UNIQUE NOT NULL,
  description text DEFAULT '',
  slug text UNIQUE NOT NULL,
  icon_name text DEFAULT 'Gamepad2',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "games_select" ON games;
CREATE POLICY "games_select" ON games FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "games_insert" ON games;
CREATE POLICY "games_insert" ON games FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "games_update" ON games;
CREATE POLICY "games_update" ON games FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "games_delete" ON games;
CREATE POLICY "games_delete" ON games FOR DELETE
TO authenticated USING (true);

-- ============================================================
-- GAME SCORES
-- ============================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scores_select" ON game_scores;
CREATE POLICY "scores_select" ON game_scores FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "scores_insert" ON game_scores;
CREATE POLICY "scores_insert" ON game_scores FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "scores_delete" ON game_scores;
CREATE POLICY "scores_delete" ON game_scores FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_game_scores_game_score ON game_scores(game_id, score DESC);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON posts;
CREATE POLICY "posts_select" ON posts FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "posts_insert" ON posts;
CREATE POLICY "posts_insert" ON posts FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_update" ON posts;
CREATE POLICY "posts_update" ON posts FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "posts_delete" ON posts;
CREATE POLICY "posts_delete" ON posts FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert" ON comments;
CREATE POLICY "comments_insert" ON comments FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_delete" ON comments FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id, created_at);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select" ON likes;
CREATE POLICY "likes_select" ON likes FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "likes_insert" ON likes;
CREATE POLICY "likes_insert" ON likes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "likes_delete" ON likes;
CREATE POLICY "likes_delete" ON likes FOR DELETE
TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select" ON follows;
CREATE POLICY "follows_select" ON follows FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "follows_insert" ON follows;
CREATE POLICY "follows_insert" ON follows FOR INSERT
TO authenticated WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "follows_delete" ON follows;
CREATE POLICY "follows_delete" ON follows FOR DELETE
TO authenticated USING (auth.uid() = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED GAMES
-- ============================================================
INSERT INTO games (title, description, slug, icon_name) VALUES
  ('Memory Match', 'Flip cards to find matching pairs. Fewer moves = higher score.', 'memory-match', 'Brain'),
  ('Reaction Test', 'Click as fast as you can when the screen turns green.', 'reaction-test', 'Zap'),
  ('Number Guess', 'Guess the secret number in as few tries as possible.', 'number-guess', 'Hash'),
  ('Tic-Tac-Toe AI', 'Play classic Tic-Tac-Toe against an AI opponent.', 'tic-tac-toe', 'Grid3x3'),
  ('Snake', 'Eat the food, grow longer, and avoid hitting the walls.', 'snake', 'Worm'),
  ('Color Code', 'Memorize and repeat the growing color sequence.', 'color-code', 'Palette')
ON CONFLICT (title) DO NOTHING;
