-- =============================================================================
-- Migration: Create user_preferences table for 7kanime reading preferences
-- Date: 2026-05-21
-- Author: SDD Implementation (manga-paginated-reader)
-- =============================================================================
--
-- This table stores a single JSONB record per user with their reading
-- preferences (e.g., readingMode: 'cascade' | 'paginated').
--
-- HOW TO RUN:
-- 1. Open your Supabase dashboard: https://supabase.com/dashboard
-- 2. Go to your project
-- 3. Click "SQL Editor" in the left sidebar
-- 4. Create a "New query"
-- 5. Copy and paste the SQL below
-- 6. Click "Run"
-- =============================================================================

-- Drop table if it exists (clean start - only use if you're sure!)
-- DROP TABLE IF EXISTS user_preferences;

-- Create the table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  preferences JSONB NOT NULL DEFAULT '{"readingMode": "cascade"}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a comment explaining the table
COMMENT ON TABLE user_preferences IS 'Stores user reading preferences for the manga chapter reader (7kanime app)';

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
--
-- RLS ensures that users can ONLY read/write their OWN preferences.
-- The Clerk JWT token contains the user ID in the 'sub' claim.
--
-- NOTE: If you see "Could not find the table in the schema cache" errors
-- from your frontend, it means this migration hasn't been run yet!
-- =============================================================================

-- Enable RLS on the table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can READ only their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_preferences
  FOR SELECT
  USING (
    user_id = (
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Policy: Users can INSERT/UPDATE only their own preferences
CREATE POLICY "Users can upsert own preferences"
  ON user_preferences
  FOR ALL
  USING (
    user_id = (
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
  )
  WITH CHECK (
    user_id = (
      current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- =============================================================================
-- Verification queries (run these after creating the table to verify)
-- =============================================================================

-- Check if table exists
-- SELECT * FROM information_schema.tables WHERE table_name = 'user_preferences';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'user_preferences';

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
