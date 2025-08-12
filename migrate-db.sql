-- Database migration script
-- Run this in your Supabase SQL editor to ensure all tables exist

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate captures table to ensure all columns exist
DROP TABLE IF EXISTS captures CASCADE;

CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  canonical_name TEXT NOT NULL,
  common_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('flower', 'bug', 'animal')),
  confidence DECIMAL(3,2) NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('plantid', 'gcv')),
  thumb_url TEXT,
  location_hint TEXT,
  gbif_key INTEGER,
  summary TEXT,
  fun_facts TEXT[],
  color_chips TEXT[],
  coins_earned INTEGER DEFAULT 0,
  is_new_species BOOLEAN DEFAULT false
);

-- Ensure users table has all required columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_captures INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unique_species_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS kid_mode BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;

-- Create badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subtype TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  count INTEGER DEFAULT 0,
  next_goal INTEGER NOT NULL,
  UNIQUE(user_id, category, subtype)
);

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  coins_rewarded INTEGER DEFAULT 0,
  icon TEXT,
  UNIQUE(user_id, type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_captures_user_id ON captures(user_id);
CREATE INDEX IF NOT EXISTS idx_captures_category ON captures(category);
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
