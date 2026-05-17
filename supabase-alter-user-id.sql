-- ============================================================
-- Alter user_id columns from uuid to text for Clerk compatibility
-- ============================================================
-- Clerk user IDs are strings like "user_3DpXMjzbTpQUPiDSmNpig2lKE7z"
-- and do not match the UUID format. This migration changes all
-- user_id columns to text type.
--
-- Run this in the Supabase SQL Editor after creating tables.
-- ============================================================

-- anime_favorites
ALTER TABLE anime_favorites ALTER COLUMN user_id TYPE text;

-- manga_favorites
ALTER TABLE manga_favorites ALTER COLUMN user_id TYPE text;

-- episode_history
ALTER TABLE episode_history ALTER COLUMN user_id TYPE text;

-- chapter_history
ALTER TABLE chapter_history ALTER COLUMN user_id TYPE text;

-- custom_lists
ALTER TABLE custom_lists ALTER COLUMN user_id TYPE text;

-- Note: custom_list_items does not have a user_id column
-- (it references custom_lists via list_id)
