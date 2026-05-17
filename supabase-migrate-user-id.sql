-- =============================================
-- MIGRATE: Change user_id from uuid to text for Clerk compatibility
-- =============================================
-- Run this in Supabase SQL Editor
-- This drops ALL policies dynamically, alters columns, then recreates everything

-- Step 1: Drop ALL policies dynamically (no hardcoded names)
DO $$
DECLARE
    pol record;
BEGIN
    -- anime_favorites
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'anime_favorites'
    LOOP
        EXECUTE format('DROP POLICY %I ON anime_favorites', pol.policyname);
    END LOOP;

    -- manga_favorites
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'manga_favorites'
    LOOP
        EXECUTE format('DROP POLICY %I ON manga_favorites', pol.policyname);
    END LOOP;

    -- episode_history
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'episode_history'
    LOOP
        EXECUTE format('DROP POLICY %I ON episode_history', pol.policyname);
    END LOOP;

    -- chapter_history
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'chapter_history'
    LOOP
        EXECUTE format('DROP POLICY %I ON chapter_history', pol.policyname);
    END LOOP;

    -- custom_lists
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'custom_lists'
    LOOP
        EXECUTE format('DROP POLICY %I ON custom_lists', pol.policyname);
    END LOOP;

    -- custom_list_items
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'custom_list_items'
    LOOP
        EXECUTE format('DROP POLICY %I ON custom_list_items', pol.policyname);
    END LOOP;
END $$;

-- Step 2: Drop foreign key constraints (they reference auth.users(id) which is uuid)
ALTER TABLE anime_favorites DROP CONSTRAINT IF EXISTS anime_favorites_user_id_fkey;
ALTER TABLE manga_favorites DROP CONSTRAINT IF EXISTS manga_favorites_user_id_fkey;
ALTER TABLE episode_history DROP CONSTRAINT IF EXISTS episode_history_user_id_fkey;
ALTER TABLE chapter_history DROP CONSTRAINT IF EXISTS chapter_history_user_id_fkey;
ALTER TABLE custom_lists DROP CONSTRAINT IF EXISTS custom_lists_user_id_fkey;

-- Step 3: Drop the old function
DROP FUNCTION IF EXISTS get_clerk_user_id();

-- Step 4: Alter user_id columns from uuid to text
ALTER TABLE anime_favorites ALTER COLUMN user_id TYPE text;
ALTER TABLE manga_favorites ALTER COLUMN user_id TYPE text;
ALTER TABLE episode_history ALTER COLUMN user_id TYPE text;
ALTER TABLE chapter_history ALTER COLUMN user_id TYPE text;
ALTER TABLE custom_lists ALTER COLUMN user_id TYPE text;

-- Step 5: Create the new function that returns text (for Clerk)
CREATE OR REPLACE FUNCTION get_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::json->>'sub', '');
$$;

-- Step 6: Recreate RLS policies for anime_favorites
CREATE POLICY "Users can view own anime favorites"
  ON anime_favorites FOR SELECT
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can insert own anime favorites"
  ON anime_favorites FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

CREATE POLICY "Users can update own anime favorites"
  ON anime_favorites FOR UPDATE
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can delete own anime favorites"
  ON anime_favorites FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- Step 7: Recreate RLS policies for manga_favorites
CREATE POLICY "Users can view own manga favorites"
  ON manga_favorites FOR SELECT
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can insert own manga favorites"
  ON manga_favorites FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

CREATE POLICY "Users can update own manga favorites"
  ON manga_favorites FOR UPDATE
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can delete own manga favorites"
  ON manga_favorites FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- Step 8: Recreate RLS policies for episode_history
CREATE POLICY "Users can view own episode history"
  ON episode_history FOR SELECT
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can insert own episode history"
  ON episode_history FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

CREATE POLICY "Users can update own episode history"
  ON episode_history FOR UPDATE
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can delete own episode history"
  ON episode_history FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- Step 9: Recreate RLS policies for chapter_history
CREATE POLICY "Users can view own chapter history"
  ON chapter_history FOR SELECT
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can insert own chapter history"
  ON chapter_history FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

CREATE POLICY "Users can update own chapter history"
  ON chapter_history FOR UPDATE
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can delete own chapter history"
  ON chapter_history FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- Step 10: Recreate RLS policies for custom_lists
CREATE POLICY "Users can view own lists"
  ON custom_lists FOR SELECT
  USING (get_clerk_user_id() = user_id OR is_public = true);

CREATE POLICY "Users can insert own lists"
  ON custom_lists FOR INSERT
  WITH CHECK (get_clerk_user_id() = user_id);

CREATE POLICY "Users can update own lists"
  ON custom_lists FOR UPDATE
  USING (get_clerk_user_id() = user_id);

CREATE POLICY "Users can delete own lists"
  ON custom_lists FOR DELETE
  USING (get_clerk_user_id() = user_id);

-- Step 11: Recreate RLS policies for custom_list_items (uses EXISTS with custom_lists)
CREATE POLICY "Users can view list items of visible lists"
  ON custom_list_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND (custom_lists.user_id = get_clerk_user_id() OR custom_lists.is_public = true)
    )
  );

CREATE POLICY "Users can insert own list items"
  ON custom_list_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND custom_lists.user_id = get_clerk_user_id()
    )
  );

CREATE POLICY "Users can update own list items"
  ON custom_list_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND custom_lists.user_id = get_clerk_user_id()
    )
  );

CREATE POLICY "Users can delete own list items"
  ON custom_list_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM custom_lists
      WHERE custom_lists.id = custom_list_items.list_id
      AND custom_lists.user_id = get_clerk_user_id()
    )
  );
