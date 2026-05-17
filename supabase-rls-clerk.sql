-- ============================================================
-- Supabase RLS Policies for Clerk JWT Authentication
-- ============================================================
-- This file must be run in the Supabase SQL Editor (or via migrations).
-- It replaces Supabase Auth's auth.uid() with a custom function
-- that extracts the user ID from a Clerk JWT Bearer token.
--
-- HOW IT WORKS:
-- When the frontend makes a request, it injects the Clerk session token
-- as the Authorization: Bearer <token> header via createClerkSupabaseClient().
-- Supabase's pg_jwt extension decodes the token's `sub` claim.
-- The get_clerk_user_id() function reads it from current_setting().
--
-- IMPORTANT: Configure your Supabase project to use the Clerk JWT secret:
--   Go to Authentication > Providers > JWT > Enter your Clerk JWT signing key.
--   Target the 'sub' claim to match the user ID namespace.
-- ============================================================

-- ── Helper function ───────────────────────────────────────────────────────────

/**
 * Extracts the Clerk user ID (the `sub` claim) from the current JWT.
 *
 * How it's read:
 *   request.jwt.claims is a JSONB column set by pg_jwt when the
 *   Authorization header contains a valid Clerk Bearer token.
 *   We read 'sub' from it and cast to uuid.
 *
 * Returns NULL if:
 *   - No Authorization header (guest mode)
 *   - Token is invalid/expired (Supabase will reject the request before this runs)
 *   - The `sub` claim is not a valid UUID
 */
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '');
$;

-- ── anime_favorites ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own anime favorites" ON anime_favorites;
CREATE POLICY "Users can view own anime favorites"
  ON anime_favorites FOR SELECT
  USING (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own anime favorites" ON anime_favorites;
CREATE POLICY "Users can insert own anime favorites"
  ON anime_favorites FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own anime favorites" ON anime_favorites;
CREATE POLICY "Users can update own anime favorites"
  ON anime_favorites FOR UPDATE
  USING (get_clerk_user_id() = user_id)
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own anime favorites" ON anime_favorites;
CREATE POLICY "Users can delete own anime favorites"
  ON anime_favorites FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- ── manga_favorites ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own manga favorites" ON manga_favorites;
CREATE POLICY "Users can view own manga favorites"
  ON manga_favorites FOR SELECT
  USING (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own manga favorites" ON manga_favorites;
CREATE POLICY "Users can insert own manga favorites"
  ON manga_favorites FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own manga favorites" ON manga_favorites;
CREATE POLICY "Users can update own manga favorites"
  ON manga_favorites FOR UPDATE
  USING (get_clerk_user_id() = user_id)
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own manga favorites" ON manga_favorites;
CREATE POLICY "Users can delete own manga favorites"
  ON manga_favorites FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- ── episode_history ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own episode history" ON episode_history;
CREATE POLICY "Users can view own episode history"
  ON episode_history FOR SELECT
  USING (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own episode history" ON episode_history;
CREATE POLICY "Users can insert own episode history"
  ON episode_history FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own episode history" ON episode_history;
CREATE POLICY "Users can update own episode history"
  ON episode_history FOR UPDATE
  USING (get_clerk_user_id() = user_id)
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own episode history" ON episode_history;
CREATE POLICY "Users can delete own episode history"
  ON episode_history FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- ── chapter_history ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own chapter history" ON chapter_history;
CREATE POLICY "Users can view own chapter history"
  ON chapter_history FOR SELECT
  USING (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can insert own chapter history" ON chapter_history;
CREATE POLICY "Users can insert own chapter history"
  ON chapter_history FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own chapter history" ON chapter_history;
CREATE POLICY "Users can update own chapter history"
  ON chapter_history FOR UPDATE
  USING (get_clerk_user_id() = user_id)
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own chapter history" ON chapter_history;
CREATE POLICY "Users can delete own chapter history"
  ON chapter_history FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- ── custom_lists ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own custom lists" ON custom_lists;
CREATE POLICY "Users can view own custom lists"
  ON custom_lists FOR SELECT
  USING (get_clerk_user_id() = user_id OR is_public = true);

DROP POLICY IF EXISTS "Users can insert own custom lists" ON custom_lists;
CREATE POLICY "Users can insert own custom lists"
  ON custom_lists FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can update own custom lists" ON custom_lists;
CREATE POLICY "Users can update own custom lists"
  ON custom_lists FOR UPDATE
  USING (get_clerk_user_id() = user_id)
  WITH CHECK (get_clerk_user_id() = user_id);

DROP POLICY IF EXISTS "Users can delete own custom lists" ON custom_lists;
CREATE POLICY "Users can delete own custom lists"
  ON custom_lists FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- ── custom_list_items ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view list items of visible lists" ON custom_list_items;
CREATE POLICY "Users can view list items of visible lists"
  ON custom_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND (custom_lists.user_id = get_clerk_user_id() OR custom_lists.is_public = true)
    )
  );

DROP POLICY IF EXISTS "Users can insert items into own lists" ON custom_list_items;
CREATE POLICY "Users can insert items into own lists"
  ON custom_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND custom_lists.user_id = get_clerk_user_id()
    )
  );

DROP POLICY IF EXISTS "Users can update items in own lists" ON custom_list_items;
CREATE POLICY "Users can update items in own lists"
  ON custom_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND custom_lists.user_id = get_clerk_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND custom_lists.user_id = get_clerk_user_id()
    )
  );

DROP POLICY IF EXISTS "Users can delete items from own lists" ON custom_list_items;
CREATE POLICY "Users can delete items from own lists"
  ON custom_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND custom_lists.user_id = get_clerk_user_id()
    )
  );

-- ── Enable RLS on all tables ──────────────────────────────────────────────────

ALTER TABLE anime_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE manga_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_list_items ENABLE ROW LEVEL SECURITY;