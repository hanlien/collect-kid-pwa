-- User Progress Table Schema
-- This table stores user progress (collections, badges, coins, level, experience) for each profile
-- Progress is synced across all devices for each profile

CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  profile_id VARCHAR(255) NOT NULL UNIQUE,
  collections JSONB DEFAULT '[]'::jsonb,
  badges JSONB DEFAULT '[]'::jsonb,
  coins INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups by profile_id
CREATE INDEX IF NOT EXISTS idx_user_progress_profile_id ON user_progress(profile_id);

-- Index for last_updated for cleanup operations
CREATE INDEX IF NOT EXISTS idx_user_progress_last_updated ON user_progress(last_updated);

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update last_updated
CREATE TRIGGER update_user_progress_last_updated
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated();

-- Function to clean up old progress (keep last 30 days)
CREATE OR REPLACE FUNCTION clean_old_user_progress()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_progress 
  WHERE last_updated < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE user_progress TO authenticated;
GRANT ALL PRIVILEGES ON TABLE user_progress TO service_role;
GRANT USAGE, SELECT ON SEQUENCE user_progress_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_progress_id_seq TO service_role;

-- Enable Row Level Security (RLS)
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own progress
CREATE POLICY "Users can access their own progress" ON user_progress
  FOR ALL USING (profile_id = current_setting('request.jwt.claims', true)::json->>'profile_id');

-- Comments for documentation
COMMENT ON TABLE user_progress IS 'Stores user progress (collections, badges, coins, level, experience) for each profile';
COMMENT ON COLUMN user_progress.profile_id IS 'Unique identifier for the user profile';
COMMENT ON COLUMN user_progress.collections IS 'JSON array of collected species';
COMMENT ON COLUMN user_progress.badges IS 'JSON array of earned badges';
COMMENT ON COLUMN user_progress.coins IS 'Current coin balance';
COMMENT ON COLUMN user_progress.level IS 'Current user level';
COMMENT ON COLUMN user_progress.experience IS 'Current experience points';
COMMENT ON COLUMN user_progress.last_updated IS 'Timestamp of last progress update';
