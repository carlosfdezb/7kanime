-- Migration: Add user_preferences table for storing user reading preferences
-- This table stores a single JSONB record per user with their preferences

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  preferences JSONB NOT NULL DEFAULT '{"readingMode": "cascade"}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies using Clerk JWT claims
-- The 'sub' claim contains the Clerk user ID

CREATE POLICY "Users can read own preferences" ON user_preferences
  FOR SELECT
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can upsert own preferences" ON user_preferences
  FOR ALL
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'))
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub'));